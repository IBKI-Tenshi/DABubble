import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { HttpClient } from '@angular/common/http';

import {
  Auth,
  signInWithPopup,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
} from '@angular/fire/auth';
import { Firestore, doc, getDoc } from '@angular/fire/firestore';

import { UserDataService } from './user_data.service';
import { UrlService } from './url.service';

@Injectable({
  providedIn: 'root',
})
export class LoginService {
  private isLoggedInSubject = new BehaviorSubject<boolean>(false);
  public isLoggedIn$ = this.isLoggedInSubject.asObservable();

  private readonly USER_TOKEN_KEY = 'slack_clone_user_token';
  private readonly GOOGLE_TOKEN_KEY = 'slack_clone_google_token';
  private readonly GUEST_TOKEN_KEY = 'slack_clone_guest_token';
  private readonly USER_ID_KEY = 'slack_clone_user_id';
  private readonly USER_EMAIL_KEY = 'slack_clone_user_email';
  private readonly USER_NAME_KEY = 'slack_clone_user_name';
  private readonly GUEST_NAME_KEY = 'slack_clone_guest_name';
  private readonly LOGIN_TIMESTAMP_KEY = 'slack_clone_login_timestamp';

  constructor(
    private http: HttpClient,
    private router: Router,
    private userDataService: UserDataService,
    private urlService: UrlService,
    private auth: Auth,
    private firestore: Firestore
  ) {
    setTimeout(() => {
      this.initializeLoginStatus();
    }, 200);
  }

  private initializeLoginStatus(): void {
    const hasToken = this.checkToken();

    if (hasToken) {
      this.isLoggedInSubject.next(true);
      localStorage.setItem('slack_clone_is_logged_in', 'true');

      const userId = localStorage.getItem(this.USER_ID_KEY);
      const guestToken = localStorage.getItem(this.GUEST_TOKEN_KEY);

      if (userId) {
        this.userDataService.loadUser(userId);
      } else if (guestToken) {
        this.userDataService.loadGuestProfile();
      }
    } else {
      this.isLoggedInSubject.next(false);
      localStorage.removeItem('slack_clone_is_logged_in');
    }
  }

  loginWithGoogle() {
    const provider = new GoogleAuthProvider();
    return signInWithPopup(this.auth, provider);
  }

  private checkToken(): boolean {
    return (
      localStorage.getItem(this.USER_TOKEN_KEY) !== null ||
      localStorage.getItem(this.GOOGLE_TOKEN_KEY) !== null ||
      localStorage.getItem(this.GUEST_TOKEN_KEY) !== null
    );
  }

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
      const userCredential = await signInWithEmailAndPassword(
        this.auth,
        email,
        password
      );
      const user = userCredential.user;

      const userDocRef = doc(this.firestore, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        const userData = userDoc.data();
        console.log('User data:', userData); // Optional for debug/logging
      }

      const timestamp = Date.now();
      const token = `user-token-${timestamp}`;

      this.saveTokens('user', token, user.uid, user.email || '', timestamp);
      await this.userDataService.loadUser(user.uid);

      setTimeout(() => {
        this.router.navigate(['/directMessage/general']);
      }, 100);

      return { success: true, uid: user.uid, email: user.email || '' };
    } catch (error) {
      console.error('Firebase Auth error:', error);
      return { success: false, reason: 'auth/wrong-password' };
    }
  }

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

    localStorage.removeItem(this.USER_TOKEN_KEY);
    localStorage.removeItem(this.GOOGLE_TOKEN_KEY);
    localStorage.removeItem(this.GUEST_TOKEN_KEY);

    localStorage.setItem(tokenKey, tokenValue);
    localStorage.setItem(this.USER_ID_KEY, userId);

    if (email) {
      localStorage.setItem(this.USER_EMAIL_KEY, email);
    }

    if (timestamp) {
      localStorage.setItem(this.LOGIN_TIMESTAMP_KEY, timestamp.toString());
    }

    localStorage.setItem('slack_clone_is_logged_in', 'true');
    this.isLoggedInSubject.next(true);
  }

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

    setTimeout(() => {
      this.router.navigate(['/directMessage/general']);
    }, 100);

    return { uid: guestId };
  }

  logout(): void {
    this.isLoggedInSubject.next(false);
    localStorage.removeItem(this.USER_TOKEN_KEY);
    localStorage.removeItem(this.GOOGLE_TOKEN_KEY);
    localStorage.removeItem(this.GUEST_TOKEN_KEY);
    localStorage.removeItem(this.USER_ID_KEY);
    localStorage.removeItem(this.USER_EMAIL_KEY);
    localStorage.removeItem(this.USER_NAME_KEY);
    localStorage.removeItem(this.GUEST_NAME_KEY);
    localStorage.removeItem(this.LOGIN_TIMESTAMP_KEY);
    localStorage.removeItem('slack_clone_is_logged_in');

    this.userDataService.clear();
  }

  isLoggedIn(): boolean {
    const subjectValue = this.isLoggedInSubject.getValue();
    const storageValue =
      localStorage.getItem('slack_clone_is_logged_in') === 'true';

    if (subjectValue !== storageValue) {
      const hasToken = this.checkToken();
      const hasLegacyToken = !!localStorage.getItem('legacy_token');

      if (hasToken || hasLegacyToken) {
        this.isLoggedInSubject.next(true);
        localStorage.setItem('slack_clone_is_logged_in', 'true');
        return true;
      } else {
        this.isLoggedInSubject.next(false);
        localStorage.removeItem('slack_clone_is_logged_in');
      }
    }

    return this.isLoggedInSubject.getValue();
  }

  checkIfGuestIsLoggedIn(): boolean {
    return localStorage.getItem(this.GUEST_TOKEN_KEY) !== null;
  }

  googleLoginWithCredential(token: string, payload: any): void {
    const googleUserId = payload.sub;
    const email = payload.email;
    const timestamp = Date.now();

    this.saveTokens('google', token, googleUserId, email, timestamp);
    this.userDataService.loadUser(googleUserId);

    setTimeout(() => {
      this.router.navigate(['/directMessage']);
    }, 100);
  }
}
