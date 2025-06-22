import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { UrlService } from './url.service';

export interface UserProfile {
  id?: string;
  name?: string;
  email?: string;
  profileImage?: string;
  profile?: number;
  isGuest?: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class UserDataService {
  private _name: string = '';
  private _userId: string = '';
  private _email: string = '';
  private _profileImage: string = '/assets/img/dummy_pic.png';
  private _isGuest: boolean = false;
  
  private userSubject = new BehaviorSubject<UserProfile | null>(null);
  public user$: Observable<UserProfile | null> = this.userSubject.asObservable();
  
  // Getter für den aktuellen User-Wert
  public get currentUserValue(): UserProfile | null {
    return this.userSubject.getValue();
  }

  constructor(private http: HttpClient, private urlService: UrlService) {
    console.log("UserDataService wird initialisiert");
    
    this._isGuest = localStorage.getItem('guest_token') !== null;
    
    if (this._isGuest) {
      this.loadGuestProfile();
    } else {
      const userId = localStorage.getItem('userId');
      if (userId) {
        this._userId = userId;
        this.loadUserFromFirestore(userId);
      }
    }
  }

  // Hilft beim Debuggen von Avatar-Problemen
  debugAvatarStatus(context: string = 'Debug-Check'): void {
    const profileArray = [
      '/assets/img/avatar/avatar_1.png',
      '/assets/img/avatar/avatar_2.png',
      '/assets/img/avatar/avatar_3.png',
      '/assets/img/avatar/avatar_4.png',
      '/assets/img/avatar/avatar_5.png',
      '/assets/img/avatar/avatar_6.png',
    ];
    
    const currentProfileIndex = this.currentUserValue?.profile || -1;
    const storedProfileIndex = localStorage.getItem('user_profile_index');
    
    console.log(`---- Avatar Debug [${context}] ----`);
    console.log(`Current avatar in service: ${this._profileImage}`);
    console.log(`Current profile index in service: ${currentProfileIndex}`);
    console.log(`Current profile index in localStorage: ${storedProfileIndex}`);
    
    if (currentProfileIndex >= 0 && currentProfileIndex < profileArray.length) {
      console.log(`Expected avatar path: ${profileArray[currentProfileIndex]}`);
    } else {
      console.log(`Current profile index invalid: ${currentProfileIndex}`);
    }
    
    const user = this.currentUserValue;
    console.log('Current user object:', user);
    console.log(`---- End Avatar Debug [${context}] ----`);
  }

  loadGuestProfile(): void {
    // Lade gespeicherten Gast-Namen oder verwende "Frederik Leck" als Standard
    this._name = localStorage.getItem('guest_name') || 'Frederik Leck';
    this._email = 'frederik.leck@example.com';
    this._isGuest = true;
    
    const guestAvatar = localStorage.getItem('guest_avatar');
    const guestAvatarIndex = localStorage.getItem('guest_avatar_index');
    
    if (guestAvatar) {
      this._profileImage = guestAvatar;
    }
    
    this.userSubject.next({
      id: 'guest',
      name: this._name,
      email: this._email,
      profileImage: this._profileImage,
      profile: guestAvatarIndex ? parseInt(guestAvatarIndex) : 0,
      isGuest: true
    });
    
    console.log("Gast-Profil geladen:", this._name);
  }

  private async loadUserFromFirestore(userId: string): Promise<void> {
    try {
      console.log(`Lade Benutzer mit ID ${userId} aus Firebase...`);
      
      // WICHTIG: Prüfe zuerst, ob es bereits einen gespeicherten Index gibt
      let existingProfileIndex = localStorage.getItem('user_profile_index');
      if (existingProfileIndex) {
        console.log(`Gespeicherter Profil-Index gefunden: ${existingProfileIndex}`);
      }
      
      const userData = await this.getUserFromFirestore(userId);
      
      if (userData) {
        console.log("Firebase-Daten geladen:", userData);
        
        this._name = userData.name || '';
        
        // Name in localStorage speichern
        if (this._name) {
          localStorage.setItem('user_name', this._name);
        }
        
        this._email = userData.email || '';
        
        if (!this._email) {
          const storedEmail = localStorage.getItem('user_email');
          if (storedEmail) {
            this._email = storedEmail;
            console.log(`Email aus localStorage verwendet: ${this._email}`);
          }
        }
        
        // WICHTIG: Verbesserte Avatar-Verarbeitung mit Priorität für Firebase-Daten
        let profileIndex = 0;
        
        // Erste Priorität: Wert aus Firebase
        if (userData.profile !== undefined) {
          profileIndex = userData.profile;
          localStorage.setItem('user_profile_index', profileIndex.toString());
          console.log(`Profil-Index aus Firebase verwendet: ${profileIndex}`);
        } 
        // Zweite Priorität: Wert aus localStorage
        else if (existingProfileIndex !== null) {
          profileIndex = parseInt(existingProfileIndex);
          console.log(`Profil-Index aus localStorage verwendet: ${profileIndex}`);
        } 
        // Fallback
        else {
          console.log(`Kein Profil-Index gefunden, Standard: 0`);
        }
        
        // Avatar-Pfad entsprechend dem Index setzen
        const avatarArray = [
          '/assets/img/avatar/avatar_1.png',
          '/assets/img/avatar/avatar_2.png',
          '/assets/img/avatar/avatar_3.png',
          '/assets/img/avatar/avatar_4.png',
          '/assets/img/avatar/avatar_5.png',
          '/assets/img/avatar/avatar_6.png',
        ];
        
        if (profileIndex >= 0 && profileIndex < avatarArray.length) {
          this._profileImage = avatarArray[profileIndex];
        } else {
          console.warn(`Ungültiger Profil-Index: ${profileIndex}, setze auf 0`);
          profileIndex = 0;
          this._profileImage = avatarArray[0];
        }
        
        console.log(`Avatar gesetzt auf Index ${profileIndex}: ${this._profileImage}`);
        
        this.userSubject.next({
          id: userId,
          name: this._name,
          email: this._email,
          profileImage: this._profileImage,
          profile: profileIndex,
          isGuest: false
        });
        
        // WICHTIG: Zusätzliches Debug-Logging
        this.debugAvatarStatus("Nach Laden aus Firebase");
      } else {
        // ...Rest der Methode bleibt unverändert...
      }
    } catch (error) {
      console.error("Fehler beim Laden der Benutzerdaten:", error);
    }
  }

  async getUserFromFirestore(userId: string): Promise<UserProfile | null> {
    try {
      const url = `${this.urlService.BASE_URL}/users/${userId}`;
      console.log("Rufe Firebase-URL auf:", url);
      
      const response = await fetch(url);
      console.log("Firebase Response Status:", response.status);
      
      if (!response.ok) {
        console.warn(`Firebase HTTP Error: ${response.status}`);
        return null;
      }
      
      const data = await response.json();
      console.log("Rohe Firestore-Daten:", data);
      
      if (!data || !data.fields) {
        console.warn("Keine gültigen Firestore-Daten erhalten");
        return null;
      }
      
      const fields = data.fields;
      
      const name = fields.name?.stringValue || '';
      console.log("Extrahierter Name:", name);
      
      const email = fields.email?.stringValue || localStorage.getItem('user_email') || '';
      console.log("Extrahierte E-Mail:", email);
      
      // Extrahiere den Profil-Index mit erweiterten Logging
      let profile = 0;
      if (fields.profile !== undefined) {
        console.log("Profil-Feld gefunden:", fields.profile);
        
        if (fields.profile.integerValue !== undefined) {
          profile = parseInt(fields.profile.integerValue);
          console.log("Extrahierter Profil-Index (integer):", profile);
        } else if (fields.profile.stringValue !== undefined) {
          profile = parseInt(fields.profile.stringValue);
          console.log("Extrahierter Profil-Index (string):", profile);
        } else {
          console.warn("Profil-Feldtyp nicht erkannt:", fields.profile);
        }
        
        if (isNaN(profile)) {
          console.warn("Ungültiger Profil-Index, setze auf 0");
          profile = 0;
        }
        
        // WICHTIG: Speichere den Index direkt im localStorage
        localStorage.setItem('user_profile_index', profile.toString());
        console.log(`Profil-Index ${profile} im localStorage gespeichert`);
      } else {
        console.log("Kein Profil-Index in Firestore gefunden");
      }
      
      return {
        id: userId,
        name: name,
        email: email,
        profile: profile
      };
    } catch (error) {
      console.error("Fehler bei der Verarbeitung der Firestore-Antwort:", error);
      return null;
    }
  }

  async updateUserProfile(userId: string | null, updates: Partial<UserProfile>): Promise<boolean> {
    console.log("updateUserProfile aufgerufen für:", userId, updates);
    
    const isCurrentlyGuest = localStorage.getItem('guest_token') !== null;
    
    if (isCurrentlyGuest || !userId || userId === 'guest') {
      return this.updateGuestProfile(updates);
    }
    
    try {
      const firestoreData: any = { fields: {} };
      
      if (updates.name !== undefined) {
        firestoreData.fields.name = { stringValue: updates.name };
        this._name = updates.name;
        localStorage.setItem('user_name', updates.name); // Konsistenz sicherstellen
      }
      
      // WICHTIG: Avatar-Index immer aktualieren wenn vorhanden
      if (updates.profile !== undefined) {
        firestoreData.fields.profile = { integerValue: updates.profile };
        // Speichere auch in localStorage
        localStorage.setItem('user_profile_index', updates.profile.toString());
        console.log(`Avatar-Index wird aktualisiert auf: ${updates.profile}`);
      }
      
      console.log("Sende Daten an Firestore:", firestoreData);
      
      const fieldsToUpdate = Object.keys(firestoreData.fields);
      const updateMaskPath = fieldsToUpdate.map(field => `updateMask.fieldPaths=${field}`).join('&');
      
      const url = `${this.urlService.BASE_URL}/users/${userId}?${updateMaskPath}`;
      console.log("Update URL:", url);
      
      const response = await fetch(url, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(firestoreData)
      });
      
      console.log("Firestore Update Response:", response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Firestore Error Response:", errorText);
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      if (updates.name) this._name = updates.name;
      
      if (updates.profile !== undefined) {
        const avatarArray = [
          '/assets/img/avatar/avatar_1.png',
          '/assets/img/avatar/avatar_2.png',
          '/assets/img/avatar/avatar_3.png',
          '/assets/img/avatar/avatar_4.png',
          '/assets/img/avatar/avatar_5.png',
          '/assets/img/avatar/avatar_6.png',
        ];
        this._profileImage = avatarArray[updates.profile] || '/assets/img/dummy_pic.png';
      }
      
      // Aktuelles Benutzerobjekt holen und nur vorhandene Updates einfügen
      const currentUser = this.currentUserValue;
      const updatedUser: UserProfile = {
        ...currentUser,
        email: currentUser?.email || this._email
      };
      
      // Optional Updates einfügen
      if (updates.name) updatedUser.name = updates.name;
      if (updates.profile !== undefined) {
        updatedUser.profile = updates.profile;
        updatedUser.profileImage = this._profileImage;
      }
      
      // User-Subject aktualisieren
      this.userSubject.next(updatedUser);
      
      console.log("Profil erfolgreich aktualisiert:", updatedUser);
      return true;
    } catch (error) {
      console.error('Fehler beim Aktualisieren des Benutzerprofils:', error);
      return false;
    }
  }

  updateGuestProfile(updates: Partial<UserProfile>): boolean {
    console.log("Aktualisiere Gast-Profil:", updates);
    
    try {
      // Namensänderungen speichern
      if (updates.name !== undefined) {
        this._name = updates.name;
        localStorage.setItem('guest_name', updates.name);
        console.log(`Gast-Name wurde zu "${updates.name}" geändert`);
      }
      
      // Nur Avatar ändern, wenn tatsächlich in den Updates vorhanden
      if (updates.profile !== undefined) {
        const avatarArray = [
          '/assets/img/avatar/avatar_1.png',
          '/assets/img/avatar/avatar_2.png',
          '/assets/img/avatar/avatar_3.png',
          '/assets/img/avatar/avatar_4.png',
          '/assets/img/avatar/avatar_5.png',
          '/assets/img/avatar/avatar_6.png',
        ];
        this._profileImage = avatarArray[updates.profile] || '/assets/img/dummy_pic.png';
        localStorage.setItem('guest_avatar', this._profileImage);
        localStorage.setItem('guest_avatar_index', updates.profile.toString());
        console.log(`Gast-Avatar wurde auf Index ${updates.profile} geändert`);
      }
      
      // Aktuelles Benutzerobjekt holen und nur vorhandene Updates einfügen
      const currentUser = this.currentUserValue;
      const updatedUser: UserProfile = {
        ...currentUser,
        email: 'frederik.leck@example.com',
        isGuest: true
      };
      
      // Optional Updates einfügen
      if (updates.name) updatedUser.name = updates.name;
      if (updates.profile !== undefined) {
        updatedUser.profile = updates.profile;
        updatedUser.profileImage = this._profileImage;
      }
      
      // User-Subject aktualisieren
      this.userSubject.next(updatedUser);
      
      console.log("Gast-Profil aktualisiert:", updatedUser);
      return true;
    } catch (error) {
      console.error('Fehler beim Aktualisieren des Gast-Profils:', error);
      return false;
    }
  }

  isGuest(): boolean {
    return localStorage.getItem('guest_token') !== null;
  }

  setName(name: string): void {
    console.log(`Name wird auf "${name}" gesetzt`);
    this._name = name;
    
    // WICHTIG: Speichere Name auch in localStorage für Konsistenz
    localStorage.setItem('user_name', name);
    
    // Für Gäste im localStorage speichern
    if (this.isGuest()) {
      localStorage.setItem('guest_name', name);
    }
    
    const current = this.currentUserValue;
    if (current) {
      this.userSubject.next({...current, name: name});
    }
  }

  setUserId(userId: string): void {
    console.log(`User-ID wird auf "${userId}" gesetzt`);
    this._userId = userId;
    localStorage.setItem('userId', userId);
    
    this._isGuest = localStorage.getItem('guest_token') !== null;
    
    if (!this._isGuest) {
      this.loadUserFromFirestore(userId);
    }
  }

  getName(): string {
    // Für Gäste den gespeicherten Namen zurückgeben
    if (this.isGuest()) {
      return localStorage.getItem('guest_name') || this._name || 'Frederik Leck';
    }
    return this._name;
  }

  getUserId(): string {
    return this._userId;
  }
  
  getEmail(): string {
    if (this.isGuest()) {
      return 'frederik.leck@example.com';
    }
    return this._email || localStorage.getItem('user_email') || '';
  }
  
  getProfileImage(): string {
    return this._profileImage;
  }

  async deleteUserName() {
    if (!this.isGuest()) {
      this._name = '';
    }
  }

  async deleteUserId() {
    this._userId = '';
    localStorage.removeItem('userId');
    this.userSubject.next(null);
  }
  
  resetUserData(): void {
    const isCurrentlyGuest = localStorage.getItem('guest_token') !== null;
    
    if (isCurrentlyGuest) {
      this.loadGuestProfile();
    } else {
      this._isGuest = false;
      
      const userId = localStorage.getItem('userId');
      if (userId) {
        this._userId = userId;
        this.loadUserFromFirestore(userId);
      } else {
        this._name = '';
        this._email = '';
        this._profileImage = '/assets/img/dummy_pic.png';
        this.userSubject.next(null);
      }
    }
  }
  
  getFormattedDate(): string {
    const now = new Date();
    return now.getUTCFullYear() + '-' + 
           String(now.getUTCMonth() + 1).padStart(2, '0') + '-' +
           String(now.getUTCDate()).padStart(2, '0') + ' ' +
           String(now.getUTCHours()).padStart(2, '0') + ':' +
           String(now.getUTCMinutes()).padStart(2, '0') + ':' +
           String(now.getUTCSeconds()).padStart(2, '0');
  }
}