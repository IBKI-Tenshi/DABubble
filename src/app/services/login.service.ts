import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject } from 'rxjs';
import { UserDataService } from './user_data.service';
import { UrlService } from './url.service';
import { Router } from '@angular/router';

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
    private urlService: UrlService
  ) {
    setTimeout(() => {
      this.initializeLoginStatus();
    }, 200); 
  }

  private initializeLoginStatus(): void {
    const userToken = localStorage.getItem(this.USER_TOKEN_KEY);
    const googleToken = localStorage.getItem(this.GOOGLE_TOKEN_KEY);
    const guestToken = localStorage.getItem(this.GUEST_TOKEN_KEY);
    const userId = localStorage.getItem(this.USER_ID_KEY);
    const timestamp = localStorage.getItem(this.LOGIN_TIMESTAMP_KEY);


    if (this.checkToken()) {
      this.isLoggedInSubject.next(true);
      localStorage.setItem('slack_clone_is_logged_in', 'true');

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

  private checkToken(): boolean {
    const hasToken =
      localStorage.getItem(this.USER_TOKEN_KEY) !== null ||
      localStorage.getItem(this.GOOGLE_TOKEN_KEY) !== null ||
      localStorage.getItem(this.GUEST_TOKEN_KEY) !== null;
    return hasToken;
  }

  async logIn(email: string, password: string): Promise<any> {
    if (!email || !password) {
      return 'missing-credentials';
    }

    try {
      const userId = await this.authenticateUser(email, password);

      if (!userId) {
        return 'auth/wrong-password';
      }
      const timestamp = Date.now();
      const token = `user-token-${timestamp}`;
      this.saveTokens('user', token, userId, email, timestamp);
      await this.userDataService.loadUser(userId);
      setTimeout(() => {
        this.router.navigate(['/directMessage/general']);
      }, 100);

      return { uid: userId, email: email };
    } catch (error) {
      console.error('Fehler bei der Suche nach Benutzer-ID:', error);
      return null;
    }
  }

  private saveTokens(
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

  private async authenticateUser(
    email: string,
    password: string
  ): Promise<string | null> {
    try {
      const response = await fetch(`${this.urlService.BASE_URL}:runQuery`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          structuredQuery: {
            from: [{ collectionId: 'users' }],
            where: {
              compositeFilter: {
                op: 'AND',
                filters: [
                  {
                    fieldFilter: {
                      field: { fieldPath: 'email' },
                      op: 'EQUAL',
                      value: { stringValue: email },
                    },
                  },
                  {
                    fieldFilter: {
                      field: { fieldPath: 'password' },
                      op: 'EQUAL',
                      value: { stringValue: password },
                    },
                  },
                ],
              },
            },
          },
        }),
      });

      if (!response.ok) return null;

      const results = await response.json();
      const foundDoc = results.find((doc: any) => doc.document);

      if (foundDoc?.document) {
        const docPath = foundDoc.document.name;
        return docPath.split('/').pop() || null;
      }

      return null;
    } catch (error) {
      return null;
    }
  }

  async signInAsGuest(): Promise<any> {
    const guestId = 'guest';
    this.saveTokens(
      'guest',
      `guest-token-${Date.now()}`,
      guestId,
      undefined,
      Date.now()
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
      this.router.navigate(['/directMessage/general']);
    }, 100);
  }
}
