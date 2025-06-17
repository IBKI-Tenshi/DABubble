import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { UrlService } from './url.service';

export interface UserProfile {
  id?: string;
  name?: string;
  email?: string;
  profileImage?: string;
  profile?: number; // Avatar-Index
  isGuest?: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class UserDataService {
  private _name: string = 'Frederik Beck';
  private _userId: string = '';
  private _email: string = 'frederik.beck@example.com';
  private _profileImage: string = '/assets/img/avatar/default.png';
  private _isGuest: boolean = false;
  
  // BehaviorSubject für Echtzeitaktualisierungen
  private userSubject = new BehaviorSubject<UserProfile | null>({
    id: 'guest',
    name: this._name,
    email: this._email,
    profileImage: this._profileImage,
    isGuest: true
  });
  
  public user$ = this.userSubject.asObservable();

  constructor(private http: HttpClient, private urlService: UrlService) {
    // Prüfe, ob Gast-Token existiert
    this._isGuest = localStorage.getItem('guest_token') !== null;
    
    // Lade gespeicherte Gast-Einstellungen, falls vorhanden
    if (this._isGuest) {
      this.loadGuestProfile();
    } else {
      // Bei registriertem Benutzer Daten aus Firestore laden
      const storedId = localStorage.getItem('userId');
      if (storedId) {
        this._userId = storedId;
        this.loadUserFromFirestore(storedId);
      }
    }
  }

  private loadGuestProfile(): void {
    const guestName = localStorage.getItem('guest_name');
    const guestAvatar = localStorage.getItem('guest_avatar');
    const guestAvatarIndex = localStorage.getItem('guest_avatar_index');
    
    if (guestName) this._name = guestName;
    if (guestAvatar) this._profileImage = guestAvatar;
    
    this.userSubject.next({
      id: 'guest',
      name: this._name,
      email: this._email,
      profileImage: this._profileImage,
      profile: guestAvatarIndex ? parseInt(guestAvatarIndex) : 0,
      isGuest: true
    });
  }

  private async loadUserFromFirestore(userId: string): Promise<void> {
    try {
      const userData = await this.getUserFromFirestore(userId);
      if (userData) {
        this._name = userData.name || this._name;
        this._email = userData.email || this._email;
        
        // Avatar-Pfad basierend auf dem Profil-Index bestimmen
        if (userData.profile !== undefined) {
          const avatarIndex = userData.profile;
          const avatarArray = [
            '/assets/img/avatar/avatar_1.png',
            '/assets/img/avatar/avatar_2.png',
            '/assets/img/avatar/avatar_3.png',
            '/assets/img/avatar/avatar_4.png',
            '/assets/img/avatar/avatar_5.png',
            '/assets/img/avatar/avatar_6.png',
          ];
          this._profileImage = avatarArray[avatarIndex] || '/assets/img/avatar/default.png';
        }
        
        this.userSubject.next({
          id: userId,
          name: this._name,
          email: this._email,
          profileImage: this._profileImage,
          profile: userData.profile,
          isGuest: false
        });
      }
    } catch (error) {
      console.error('Fehler beim Laden des Benutzers aus Firestore:', error);
    }
  }

  async getUserFromFirestore(userId: string): Promise<UserProfile | null> {
    try {
      const response = await fetch(`${this.urlService.BASE_URL}/users/${userId}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const data = await response.json();
      const fields = data.fields || {};
      
      return {
        id: userId,
        name: fields.name?.stringValue || 'Frederik Beck',
        email: fields.email?.stringValue || 'frederik.beck@example.com',
        profile: fields.profile?.integerValue !== undefined ? parseInt(fields.profile.integerValue) : undefined
      };
    } catch (error) {
      console.error('Fehler beim Laden des Benutzers:', error);
      return null;
    }
  }

  async updateUserProfile(userId: string | null, updates: Partial<UserProfile>): Promise<boolean> {
    if (this._isGuest || !userId || userId === 'guest') {
      return this.updateGuestProfile(updates);
    }
    try {
      const firestoreData: any = { fields: {} };
      
      if (updates.name !== undefined) {
        firestoreData.fields.name = { stringValue: updates.name };
        this._name = updates.name;
      }
      
      if (updates.profile !== undefined) {
        firestoreData.fields.profile = { integerValue: updates.profile };
      }
      const fieldsToUpdate = Object.keys(firestoreData.fields);
      const updateMaskPath = fieldsToUpdate.map(field => `updateMask.fieldPaths=${field}`).join('&');
      
      const response = await fetch(`${this.urlService.BASE_URL}/users/${userId}?${updateMaskPath}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(firestoreData)
      });
      
      if (!response.ok) {
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
        this._profileImage = avatarArray[updates.profile] || '/assets/img/avatar/default.png';
      }
      
      const currentUser = this.userSubject.value;
      this.userSubject.next({
        ...currentUser,
        ...updates,
        profileImage: this._profileImage,
      });
      
      return true;
    } catch (error) {
      console.error('Fehler beim Aktualisieren des Benutzerprofils:', error);
      return false;
    }
  }

  updateGuestProfile(updates: Partial<UserProfile>): boolean {
    try {
      if (updates.name) {
        this._name = updates.name;
        localStorage.setItem('guest_name', updates.name);
      }
      
      if (updates.profile !== undefined) {
        const avatarArray = [
          '/assets/img/avatar/avatar_1.png',
          '/assets/img/avatar/avatar_2.png',
          '/assets/img/avatar/avatar_3.png',
          '/assets/img/avatar/avatar_4.png',
          '/assets/img/avatar/avatar_5.png',
          '/assets/img/avatar/avatar_6.png',
        ];
        this._profileImage = avatarArray[updates.profile] || '/assets/img/avatar/default.png';
        localStorage.setItem('guest_avatar', this._profileImage);
        localStorage.setItem('guest_avatar_index', updates.profile.toString());
      }
      
      const currentUser = this.userSubject.value;
      this.userSubject.next({
        ...currentUser,
        name: this._name,
        profileImage: this._profileImage,
        profile: updates.profile,
        isGuest: true
      });
      
      return true;
    } catch (error) {
      console.error('Fehler beim Aktualisieren des Gast-Profils:', error);
      return false;
    }
  }

  isGuest(): boolean {
    return this._isGuest || localStorage.getItem('guest_token') !== null;
  }

  setName(name: string): void {
    this._name = name;
    
    const current = this.userSubject.value;
    if (current) {
      this.userSubject.next({...current, name: name});
    }
    
    if (this.isGuest()) {
      localStorage.setItem('guest_name', name);
    }
  }

  setUserId(userId: string): void {
    this._userId = userId;
    localStorage.setItem('userId', userId);
    this.loadUserFromFirestore(userId);
  }

  getName(): string {
    return this._name;
  }

  getUserId(): string {
    if (this.isGuest()) {
      return 'guest';
    }
    return this._userId;
  }
  
  getProfileImage(): string {
    return this._profileImage;
  }

  async deleteUserName() {
    this._name = '';
    if (this.isGuest()) {
      localStorage.removeItem('guest_name');
    }
  }

  async deleteUserId() {
    this._userId = '';
    localStorage.removeItem('userId');
    this.userSubject.next(null);
  }
}