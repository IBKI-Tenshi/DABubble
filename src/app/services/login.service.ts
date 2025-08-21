import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';

import {
  Auth,
  signInWithPopup,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  UserCredential,
} from '@angular/fire/auth';
import { Firestore, doc, getDoc } from '@angular/fire/firestore';

import { UserDataService } from './user_data.service';
import { UrlService } from './url.service'; // kept to match your original deps

@Injectable({
  providedIn: 'root',
})
export class LoginService {
  // ---- Public auth state ----------------------------------------------------
  private isLoggedInSubject = new BehaviorSubject<boolean>(false);
  public isLoggedIn$ = this.isLoggedInSubject.asObservable();

  // ---- LocalStorage keys ----------------------------------------------------
  private readonly USER_TOKEN_KEY = 'slack_clone_user_token';
  private readonly GOOGLE_TOKEN_KEY = 'slack_clone_google_token';
  private readonly GUEST_TOKEN_KEY = 'slack_clone_guest_token';
  private readonly USER_ID_KEY = 'slack_clone_user_id';
  private readonly USER_EMAIL_KEY = 'slack_clone_user_email';
  private readonly USER_NAME_KEY = 'slack_clone_user_name';
  private readonly GUEST_NAME_KEY = 'slack_clone_guest_name';
  private readonly LOGIN_TIMESTAMP_KEY = 'slack_clone_login_timestamp';
  private readonly IS_LOGGED_IN_KEY = 'slack_clone_is_logged_in';

  // Single, consistent destination after successful auth.
  private readonly AFTER_LOGIN_ROUTE = ['/directMessage/general'];

  constructor(
    private router: Router,
    private userDataService: UserDataService,
    private urlService: UrlService,
    private auth: Auth,
    private firestore: Firestore
  ) {
    // Defer just enough to let AngularFire initialize; then reconcile state once.
    queueMicrotask(() => this.initializeLoginStatus());
  }

  // ---------------------------------------------------------------------------
  // Initialization and state reconciliation
  // ---------------------------------------------------------------------------
  /**
   * Reconciles persisted tokens with in-memory state and loads the user profile.
   * Runs once at startup.
   */
  private async initializeLoginStatus(): Promise<void> {
    const hasToken = this.checkToken();

    if (hasToken) {
      this.isLoggedInSubject.next(true);
      localStorage.setItem(this.IS_LOGGED_IN_KEY, 'true');

      const userId = localStorage.getItem(this.USER_ID_KEY);
      const guestToken = localStorage.getItem(this.GUEST_TOKEN_KEY);

      try {
        if (userId && !guestToken) {
          await this.userDataService.loadUser(userId);
        } else if (guestToken) {
          await this.userDataService.loadGuestProfile();
        }
      } catch {
        // If profile load fails, clear state to avoid weird half-logged cases.
        this.logout();
      }
    } else {
      this.isLoggedInSubject.next(false);
      localStorage.removeItem(this.IS_LOGGED_IN_KEY);
    }
  }

  // ---------------------------------------------------------------------------
  // Google popup login (Firebase provider)
  // ---------------------------------------------------------------------------
  /**
   * Full Google login flow using Firebase popup.
   * Persists a real Firebase ID token, loads the profile, and navigates.
   */
  async loginWithGoogle(): Promise<void> {
    const provider = new GoogleAuthProvider();

    try {
      const credential = await signInWithPopup(this.auth, provider);
      const user = credential.user;
      const idToken = await user.getIdToken();
      const timestamp = Date.now();

      this.saveTokens('google', idToken, user.uid, user.email || '', timestamp);
      await this.userDataService.loadUser(user.uid);

      await this.router.navigate(this.AFTER_LOGIN_ROUTE);
    } catch (err) {
      // Surface error to caller to show a snack bar there, if desired.
      console.error('Google sign-in failed:', err);
      throw err;
    }
  }

  // ---------------------------------------------------------------------------
  // Email + password login
  // ---------------------------------------------------------------------------
  /**
   * Email/password login via Firebase.
   * Returns a structured result used by the component to display errors.
   */
  async logIn(
    email: string,
    password: string
  ): Promise<{
    success: boolean;
    uid?: string;
    email?: string;
    reason?: string;
  }> {
    if (!email || !password) {
      return { success: false, reason: 'missing-credentials' };
    }

    try {
      const userCredential: UserCredential = await signInWithEmailAndPassword(
        this.auth,
        email,
        password
      );
      const user = userCredential.user;

      // Optional: read user doc for side-info; non-blocking for the flow.
      try {
        const userDocRef = doc(this.firestore, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          // You can use userDoc.data() if needed
          // console.log('User data:', userDoc.data());
        }
      } catch {
        // Ignore profile read errors; not critical for login success.
      }

      const timestamp = Date.now();
      // If you have a backend session, swap this fabricated token for a real one.
      const token = `user-token-${timestamp}`;

      this.saveTokens('user', token, user.uid, user.email || '', timestamp);
      await this.userDataService.loadUser(user.uid);

      await this.router.navigate(this.AFTER_LOGIN_ROUTE);

      return { success: true, uid: user.uid, email: user.email || '' };
    } catch (error: any) {
      // Map Firebase auth errors to UI-friendly reasons
      const code = error?.code as string | undefined;
      let reason: string | undefined = 'auth/wrong-password';
      if (code === 'auth/invalid-credential' || code === 'auth/invalid-email') {
        reason = 'auth/invalid-credential';
      } else if (code === 'auth/user-not-found') {
        reason = 'auth/user-not-found';
      } else if (code === 'auth/wrong-password') {
        reason = 'auth/wrong-password';
      }
      console.error('Firebase Auth error:', error);
      return { success: false, reason };
    }
  }

  // ---------------------------------------------------------------------------
  // Guest login
  // ---------------------------------------------------------------------------
  /**
   * Lightweight guest session. Persists a guest token and loads a guest profile.
   */
  async signInAsGuest(): Promise<{ uid: string }> {
    const guestId = 'guest';
    const timestamp = Date.now();

    this.saveTokens(
      'guest',
      `guest-token-${timestamp}`,
      guestId,
      undefined,
      timestamp
    );
    await this.userDataService.loadGuestProfile();

    await this.router.navigate(this.AFTER_LOGIN_ROUTE);

    return { uid: guestId };
  }

  // ---------------------------------------------------------------------------
  // Google One Tap / JWT credential path (if you use it)
  // ---------------------------------------------------------------------------
  /**
   * Accepts a Google ID token (JWT) and parsed payload (from One Tap).
   * Persists token, loads profile, and navigates.
   */
  async googleLoginWithCredential(token: string, payload: any): Promise<void> {
    const googleUserId: string = payload?.sub;
    const email: string | undefined = payload?.email;
    const timestamp = Date.now();

    // In a stricter setup, verify the JWT on your backend and exchange it.
    this.saveTokens('google', token, googleUserId, email, timestamp);

    // Try to load a profile keyed by googleUserId; adapt to your schema.
    await this.userDataService.loadUser(googleUserId);

    await this.router.navigate(this.AFTER_LOGIN_ROUTE);
  }

  // ---------------------------------------------------------------------------
  // Session helpers
  // ---------------------------------------------------------------------------
  /**
   * Persists the chosen token and user identity; emits logged-in state.
   */
  public saveTokens(
    tokenType: 'user' | 'google' | 'guest',
    tokenValue: string,
    userId: string,
    email?: string,
    timestamp?: number
  ): void {
    const tokenKey =
      tokenType === 'user'
        ? this.USER_TOKEN_KEY
        : tokenType === 'google'
        ? this.GOOGLE_TOKEN_KEY
        : this.GUEST_TOKEN_KEY;

    // Ensure only one token type remains.
    localStorage.removeItem(this.USER_TOKEN_KEY);
    localStorage.removeItem(this.GOOGLE_TOKEN_KEY);
    localStorage.removeItem(this.GUEST_TOKEN_KEY);

    localStorage.setItem(tokenKey, tokenValue);
    localStorage.setItem(this.USER_ID_KEY, userId);

    if (email) localStorage.setItem(this.USER_EMAIL_KEY, email);
    if (timestamp) {
      localStorage.setItem(this.LOGIN_TIMESTAMP_KEY, String(timestamp));
    }

    localStorage.setItem(this.IS_LOGGED_IN_KEY, 'true');
    this.isLoggedInSubject.next(true);
  }

  /**
   * Clears all persisted auth/session data and resets memory state.
   */
  async logout(): Promise<void> {
    this.isLoggedInSubject.next(false);
    try {
      // Attempt to sign out of Firebase (no-op for guest/when not signed).
      await this.auth.signOut().catch(() => undefined);
    } catch {
      // ignore
    }

    localStorage.removeItem(this.USER_TOKEN_KEY);
    localStorage.removeItem(this.GOOGLE_TOKEN_KEY);
    localStorage.removeItem(this.GUEST_TOKEN_KEY);
    localStorage.removeItem(this.USER_ID_KEY);
    localStorage.removeItem(this.USER_EMAIL_KEY);
    localStorage.removeItem(this.USER_NAME_KEY);
    localStorage.removeItem(this.GUEST_NAME_KEY);
    localStorage.removeItem(this.LOGIN_TIMESTAMP_KEY);
    localStorage.removeItem(this.IS_LOGGED_IN_KEY);

    this.userDataService.clear();
  }

  /**
   * Pure, side-effect-free read of current auth state.
   * Prefer this in components/guards where you need a synchronous boolean.
   */
  isLoggedInSync(): boolean {
    return this.isLoggedInSubject.getValue();
  }

  /**
   * Backward-compatible method (kept for your component). Returns the current
   * subject value without mutating storage. Prefer `isLoggedInSync()`.
   */
  isLoggedIn(): boolean {
    return this.isLoggedInSubject.getValue();
  }

  // ---------------------------------------------------------------------------
  // Internals
  // ---------------------------------------------------------------------------
  private checkToken(): boolean {
    return (
      localStorage.getItem(this.USER_TOKEN_KEY) !== null ||
      localStorage.getItem(this.GOOGLE_TOKEN_KEY) !== null ||
      localStorage.getItem(this.GUEST_TOKEN_KEY) !== null
    );
  }
}
