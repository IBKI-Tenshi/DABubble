import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { UserDataService } from './user_data.service';
import { UrlService } from './url.service';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class LoginService {
  private isLoggedInSubject = new BehaviorSubject<boolean>(false);
  public isLoggedIn$ = this.isLoggedInSubject.asObservable();

  // Konstanten für Storage-Keys
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
    console.log('🔄 LoginService wird initialisiert');

    // Beim Start einmalig Status prüfen (mit Verzögerung)
    setTimeout(() => {
      console.log('🔍 Initialisiere Login-Status...');
      this.initializeLoginStatus();
    }, 200); // Mehr Zeit geben
  }

  /**
   * Initialisiert den Login-Status beim App-Start
   */
  private initializeLoginStatus(): void {
    // Token im localStorage prüfen
    const userToken = localStorage.getItem(this.USER_TOKEN_KEY);
    const googleToken = localStorage.getItem(this.GOOGLE_TOKEN_KEY);
    const guestToken = localStorage.getItem(this.GUEST_TOKEN_KEY);
    const userId = localStorage.getItem(this.USER_ID_KEY);
    const timestamp = localStorage.getItem(this.LOGIN_TIMESTAMP_KEY);

    // Zusätzliches Debugging
    console.log('📊 Detaillierter Token-Check:', {
      userToken,
      googleToken,
      guestToken,
      userId,
      timestamp,
      hasToken: this.checkToken(),
    });

    // Überprüfen und Speichern des Tokens in einer Konsistenzprüfung
    if (this.checkToken()) {
      console.log('✅ Token gefunden, setze Login-Status auf true');

      // Explizit den Status setzen und im localStorage speichern
      this.isLoggedInSubject.next(true);
      localStorage.setItem('slack_clone_is_logged_in', 'true');

      // Benutzer laden
      if (userId) {
        console.log('👤 Lade Benutzer mit ID:', userId);
        this.userDataService.loadUser(userId);
      }
    } else {
      console.log('❌ Kein Token gefunden, setze Login-Status auf false');
      this.isLoggedInSubject.next(false);
      localStorage.removeItem('slack_clone_is_logged_in');
    }
  }

  /**
   * Prüft, ob ein gültiger Token existiert
   */
  private checkToken(): boolean {
    const hasToken =
      localStorage.getItem(this.USER_TOKEN_KEY) !== null ||
      localStorage.getItem(this.GOOGLE_TOKEN_KEY) !== null ||
      localStorage.getItem(this.GUEST_TOKEN_KEY) !== null;

    console.log('🔑 Token-Check Ergebnis:', hasToken);
    return hasToken;
  }

  /**
   * Login mit E-Mail und Passwort
   */
  async logIn(email: string, password: string): Promise<any> {
    if (!email || !password) {
      return 'missing-credentials';
    }

    try {
      const userId = await this.authenticateUser(email, password);

      if (!userId) {
        return 'auth/wrong-password';
      }

      // Token generieren und speichern
      const timestamp = Date.now();
      const token = `user-token-${timestamp}`;

      // WICHTIG: Robuste Token-Speicherung
      this.saveTokens('user', token, userId, email, timestamp);

      // Benutzerdaten laden
      await this.userDataService.loadUser(userId);
      return { uid: userId, email: email };
    } catch (error) {
      console.error('Fehler bei der Suche nach Benutzer-ID:', error);
      return null;
      console.error('Login-Fehler:', error);
      return 'auth/unknown-error';
    }
  }

  /**
   * Speichert alle Token-relevanten Daten
   */
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

    // Vorherige Tokens löschen
    localStorage.removeItem(this.USER_TOKEN_KEY);
    localStorage.removeItem(this.GOOGLE_TOKEN_KEY);
    localStorage.removeItem(this.GUEST_TOKEN_KEY);

    // Neues Token speichern
    localStorage.setItem(tokenKey, tokenValue);
    localStorage.setItem(this.USER_ID_KEY, userId);

    if (email) {
      localStorage.setItem(this.USER_EMAIL_KEY, email);
    }

    if (timestamp) {
      localStorage.setItem(this.LOGIN_TIMESTAMP_KEY, timestamp.toString());
    }

    // Login-Status speichern
    localStorage.setItem('slack_clone_is_logged_in', 'true');

    // Status setzen
    this.isLoggedInSubject.next(true);

    // Debug-Logging
    console.log(`🔒 ${tokenType.toUpperCase()}-Token gespeichert:`, {
      [tokenKey]: tokenValue,
      userId,
      email,
      timestamp,
      isLoggedIn: true,
    });

    // Konsistenzprüfung
    setTimeout(() => {
      console.log('📋 Token-Konsistenzprüfung:', {
        savedToken: localStorage.getItem(tokenKey),
        savedUserId: localStorage.getItem(this.USER_ID_KEY),
        isLoggedInValue: this.isLoggedInSubject.getValue(),
        isLoggedInStorage: localStorage.getItem('slack_clone_is_logged_in'),
      });
    }, 50);
  }

  /**
   * Authentifiziert den Benutzer gegen Firebase
   */
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
      console.error('Authentifizierungsfehler:', error);
      return null;
    }
  }

  /**
   * Gast-Login
  
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

    return { uid: guestId };
  }
     */

  /**
   * Gast-Login (Kompatibilität mit neuer Implementierung)
   */
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

    // Navigiere zur DirectMessage-Seite nach erfolgreichem Login
    setTimeout(() => {
      console.log('🚀 Navigiere nach Gast-Login zu DirectMessage');
      this.router.navigate(['/directMessage/general']);
    }, 100);

    return { uid: guestId };
  }

  /**
   * Abmelden des Benutzers
   */
  logout(): void {
    // Logging vor dem Löschen
    console.log('🔓 Tokens vor Logout:', {
      userToken: localStorage.getItem(this.USER_TOKEN_KEY),
      googleToken: localStorage.getItem(this.GOOGLE_TOKEN_KEY),
      guestToken: localStorage.getItem(this.GUEST_TOKEN_KEY),
      userId: localStorage.getItem(this.USER_ID_KEY),
    });

    // Status setzen
    this.isLoggedInSubject.next(false);

    // Alle Tokens und Daten löschen
    localStorage.removeItem(this.USER_TOKEN_KEY);
    localStorage.removeItem(this.GOOGLE_TOKEN_KEY);
    localStorage.removeItem(this.GUEST_TOKEN_KEY);
    localStorage.removeItem(this.USER_ID_KEY);
    localStorage.removeItem(this.USER_EMAIL_KEY);
    localStorage.removeItem(this.USER_NAME_KEY);
    localStorage.removeItem(this.GUEST_NAME_KEY);
    localStorage.removeItem(this.LOGIN_TIMESTAMP_KEY);
    localStorage.removeItem('slack_clone_is_logged_in');

    // Logging nach dem Löschen
    console.log('🧹 Tokens nach Logout gelöscht, neue Werte:', {
      userToken: localStorage.getItem(this.USER_TOKEN_KEY),
      googleToken: localStorage.getItem(this.GOOGLE_TOKEN_KEY),
      guestToken: localStorage.getItem(this.GUEST_TOKEN_KEY),
      userId: localStorage.getItem(this.USER_ID_KEY),
    });

    this.userDataService.clear();
  }

  /**
   * Prüft Login-Status (OHNE automatische Korrektur)
   */
  isLoggedIn(): boolean {
    // Zusätzliche Konsistenzprüfung
    const subjectValue = this.isLoggedInSubject.getValue();
    const storageValue =
      localStorage.getItem('slack_clone_is_logged_in') === 'true';

    if (subjectValue !== storageValue) {
      console.warn('⚠️ Inkonsistenz im Login-Status:', {
        subjectValue,
        storageValue,
        hasToken: this.checkToken(),
      });

      // Bei Inkonsistenz: Token prüfen und korrigieren
      if (this.checkToken()) {
        console.log('🔄 Korrigiere Login-Status auf true basierend auf Token');
        this.isLoggedInSubject.next(true);
        localStorage.setItem('slack_clone_is_logged_in', 'true');
        return true;
      } else {
        console.log(
          '🔄 Korrigiere Login-Status auf false aufgrund fehlender Tokens'
        );
        this.isLoggedInSubject.next(false);
        localStorage.removeItem('slack_clone_is_logged_in');
      }
    }

    return this.isLoggedInSubject.getValue();
  }

  /**
   * Prüft, ob ein Gast eingeloggt ist
   */
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
