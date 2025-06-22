import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject } from 'rxjs';
import { Router } from '@angular/router';
import { UserDataService } from './user_data.service';
import { UrlService } from './url.service';

@Injectable({
  providedIn: 'root'
})
export class LoginService {
  private isLoggedInSubject = new BehaviorSubject<boolean>(false);
  public isLoggedIn$ = this.isLoggedInSubject.asObservable();

  constructor(
    private http: HttpClient, 
    private router: Router,
    private userDataService: UserDataService,
    private urlService: UrlService
  ) {
    const userToken = localStorage.getItem('user_token');
    const googleToken = localStorage.getItem('google_token');
    const guestToken = localStorage.getItem('guest_token');
    
    if (userToken || googleToken || guestToken) {
      this.isLoggedInSubject.next(true);
      console.log("LoginService: Benutzer oder Gast ist angemeldet");
      
      if (guestToken) {
        console.log("LoginService: Gast-Token gefunden");
        this.userDataService.loadGuestProfile();
      } else {
        this.loadUserIdFromStorage();
      }
    }
  }

  private loadUserIdFromStorage() {
    const storedUserId = localStorage.getItem('userId');
    const storedEmail = localStorage.getItem('user_email');
    
    if (storedUserId) {
      console.log(`UserId aus localStorage geladen: ${storedUserId}`);
      this.userDataService.setUserId(storedUserId);
      return;
    }
    
    if (storedEmail) {
      const userId = storedEmail.split('@')[0];
      localStorage.setItem('userId', userId);
      console.log(`UserId aus E-Mail abgeleitet: ${userId}`);
      this.userDataService.setUserId(userId);
    }
  }

  private async findUserIdByEmail(email: string): Promise<string | null> {
    try {
      console.log(`Suche Benutzer-ID für E-Mail: ${email}`);
      
      const response = await fetch(`${this.urlService.BASE_URL}:runQuery`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          structuredQuery: {
            from: [{ collectionId: 'users' }],
            where: {
              fieldFilter: {
                field: { fieldPath: 'email' },
                op: 'EQUAL',
                value: { stringValue: email },
              },
            },
          },
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Fehler bei der Suche nach Benutzer-ID: ${response.status}`);
      }
      
      const results = await response.json();
      console.log("Suchergebnisse für E-Mail:", results);
      
      const foundDoc = results.find((doc: any) => doc.document);
      
      if (foundDoc && foundDoc.document) {
        const docPath = foundDoc.document.name;
        const userId = docPath.split('/').pop();
        console.log(`Benutzer-ID gefunden: ${userId}`);
        return userId;
      } else {
        console.warn("Keine Benutzer-ID für diese E-Mail gefunden");
        return null;
      }
    } catch (error) {
      console.error("Fehler bei der Suche nach Benutzer-ID:", error);
      return null;
    }
  }
  
  // Prüft, ob die E-Mail in Firebase existiert
  private async checkEmailExists(email: string): Promise<boolean> {
    try {
      console.log(`Prüfe, ob E-Mail existiert: ${email}`);
      
      const response = await fetch(`${this.urlService.BASE_URL}:runQuery`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          structuredQuery: {
            from: [{ collectionId: 'users' }],
            where: {
              fieldFilter: {
                field: { fieldPath: 'email' },
                op: 'EQUAL',
                value: { stringValue: email },
              },
            },
          },
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Fehler bei der E-Mail-Überprüfung: ${response.status}`);
      }
      
      const results = await response.json();
      
      // E-Mail existiert, wenn mindestens ein Dokument gefunden wurde
      const exists = results.some((doc: any) => doc.document);
      console.log(`E-Mail ${email} existiert in Firebase:`, exists);
      
      return exists;
    } catch (error) {
      console.error("Fehler bei der E-Mail-Überprüfung:", error);
      return false;
    }
  }
  
  // Überprüft Passwort bei gegebener E-Mail
  private async checkPassword(email: string, password: string): Promise<boolean> {
    try {
      console.log(`Überprüfe Passwort für E-Mail: ${email}`);
      
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
      
      if (!response.ok) {
        throw new Error(`Fehler bei der Passwort-Überprüfung: ${response.status}`);
      }
      
      const results = await response.json();
      

      const isValid = results.some((doc: any) => doc.document);
      console.log(`Passwort für ${email} ist korrekt:`, isValid);
      
      return isValid;
    } catch (error) {
      console.error("Fehler bei der Passwort-Überprüfung:", error);
      return false;
    }
  }

  async login(email: string = '', password: string = ''): Promise<boolean> {
    this.logout();
    
    if (!email || !password) {
      console.warn("E-Mail oder Passwort fehlt");
      return false;
    }
    
    console.log(`Login für ${email} wird durchgeführt`);
    
    try {
      const emailExists = await this.checkEmailExists(email);
      if (!emailExists) {
        console.error(`E-Mail ${email} existiert nicht in Firebase`);
        return false;
      }
      
      const passwordValid = await this.checkPassword(email, password);
      if (!passwordValid) {
        console.error(`Passwort für ${email} ist nicht korrekt`);
        return false;
      }
      
      console.log(`Authentifizierung erfolgreich für ${email}`);
      
      const userId = await this.findUserIdByEmail(email);
      if (!userId) {
        console.error('Keine Benutzer-ID gefunden, Login abgebrochen');
        return false;
      }
    
      localStorage.setItem('userId', userId);
      localStorage.setItem('user_token', 'dummy-token-' + new Date().getTime());
      localStorage.setItem('user_email', email);
      
      console.log(`Login erfolgreich, setze userId: ${userId}`);
      
      this.userDataService.setUserId(userId);
      this.userDataService.resetUserData();
      
      this.isLoggedInSubject.next(true);
      
      return true;
    } catch (error) {
      console.error("Fehler beim Login:", error);
      return false;
    }
  }

  // Login über Google
  async loginWithGoogle(token: string): Promise<boolean> {
    this.logout();
    
    console.log("Google-Login wird durchgeführt");
    
    try {
      
      localStorage.setItem('google_token', token);
      
      const storedEmail = localStorage.getItem('user_email');
      
      if (storedEmail) {
        const emailExists = await this.checkEmailExists(storedEmail);
        if (!emailExists) {
          console.warn(`Google-Account mit E-Mail ${storedEmail} ist nicht registriert`);
          return false;
        }
        
        const userId = await this.findUserIdByEmail(storedEmail);
        if (!userId) {
          console.error('Keine Benutzer-ID für Google-Login gefunden');
          return false;
        }
        
        localStorage.setItem('userId', userId);
        console.log(`Google Login erfolgreich, ID: ${userId}`);
        
        this.userDataService.setUserId(userId);
        this.userDataService.resetUserData();
        this.isLoggedInSubject.next(true);
        return true;
      } else {
        console.error("Keine E-Mail für Google-Login verfügbar");
        return false;
      }
    } catch (error) {
      console.error("Fehler beim Google-Login:", error);
      return false;
    }
  }

  // Gast-Login
  loginAsGuest(): boolean {
    this.logout();
    
    console.log("Gast-Login wird durchgeführt");
    
    localStorage.setItem('guest_token', 'guest-token-' + new Date().getTime());
    
    this.userDataService.loadGuestProfile();
    this.userDataService.resetUserData();
    
    this.isLoggedInSubject.next(true);
    return true;
  }

  logout(): void {
    console.log("Logout wird durchgeführt");
    
    localStorage.removeItem('user_token');
    localStorage.removeItem('google_token');
    localStorage.removeItem('userId');
    localStorage.removeItem('user_email');
    localStorage.removeItem('guest_token');
    
    this.isLoggedInSubject.next(false);
    
    this.userDataService.deleteUserId();
  }

  isLoggedIn(): boolean {
    return this.isLoggedInSubject.getValue() || localStorage.getItem('guest_token') !== null;
  }
  
  isGuestLoggedIn(): boolean {
    return localStorage.getItem('guest_token') !== null;
  }
}