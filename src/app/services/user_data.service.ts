import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { UrlService } from './url.service';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  profileImage: string;
  profile: number;
  isGuest: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class UserDataService {
  private userSubject = new BehaviorSubject<UserProfile | null>(null);
  public user$ = this.userSubject.asObservable();

  private avatarPaths = [
    '/assets/img/avatar/avatar_1.png',
    '/assets/img/avatar/avatar_2.png',
    '/assets/img/avatar/avatar_3.png',
    '/assets/img/avatar/avatar_4.png',
    '/assets/img/avatar/avatar_5.png',
    '/assets/img/avatar/avatar_6.png',
  ];

  constructor(private urlService: UrlService) {}

  get currentUser(): UserProfile | null {
    return this.userSubject.getValue();
  }

  async loadUser(userId?: string): Promise<void> {
    const id = userId || localStorage.getItem('slack_clone_user_id');
    
    if (!id) {
      console.log('⚠️ Keine User-ID gefunden');
      return;
    }
    
    console.log('🔄 Lade Benutzer mit ID:', id);
    
    // Für Gäste ein Gastprofil laden
    if (id === 'guest' || localStorage.getItem('slack_clone_guest_token')) {
      this.loadGuestProfile();
      return;
    }
    
    try {
      const userData = await this.fetchUserData(id);
      
      if (userData) {
        const profileIndex = parseInt(userData.profile?.toString() || '0');
        const profileImage = this.getAvatarPath(profileIndex);
        
        const user: UserProfile = {
          id: id,
          name: userData.name || 'Benutzer',
          email: userData.email || localStorage.getItem('slack_clone_user_email') || '',
          profileImage: profileImage,
          profile: profileIndex,
          isGuest: false
        };
        
        // Cache wichtige Werte mit den neuen Schlüsseln
        localStorage.setItem('slack_clone_user_name', user.name);
        localStorage.setItem('slack_clone_user_profile_index', profileIndex.toString());
        
        // User setzen
        this.userSubject.next(user);
        console.log('✅ User geladen:', user.name);
      } else {
        console.log('❌ Keine Benutzerdaten gefunden, versuche Cache');
        
        // Versuche aus dem localStorage zu laden
        const cachedName = localStorage.getItem('slack_clone_user_name');
        const cachedEmail = localStorage.getItem('slack_clone_user_email');
        const cachedProfile = localStorage.getItem('slack_clone_user_profile_index') || '0';
        
        if (cachedName && cachedEmail) {
          const user: UserProfile = {
            id: id,
            name: cachedName,
            email: cachedEmail,
            profileImage: this.getAvatarPath(parseInt(cachedProfile)),
            profile: parseInt(cachedProfile),
            isGuest: false
          };
          
          this.userSubject.next(user);
          console.log('✅ User aus Cache geladen:', user.name);
        }
      }
    } catch (error) {
      console.error('❌ Fehler beim Laden des Benutzers:', error);
    }
  }

  /**
   * Lädt ein Gastprofil
   */
  loadGuestProfile(): void {
    const guestProfile: UserProfile = {
      id: 'guest',
      name: localStorage.getItem('guest_name') || 'Gast',
      email: 'guest@example.com',
      profileImage: this.avatarPaths[0],
      profile: 0,
      isGuest: true
    };
    
    // NUR EINMAL den Gast setzen
    this.userSubject.next(guestProfile);
    console.log('✅ Gast-Profil geladen:', guestProfile.name);
  }

  /**
   * Lädt Benutzerdaten von Firebase
   */
  private async fetchUserData(userId: string): Promise<any> {
    try {
      const response = await fetch(`${this.urlService.BASE_URL}/users/${userId}`);
      
      if (!response.ok) return null;
      
      const data = await response.json();
      
      if (!data?.fields) return null;
      
      return {
        name: data.fields.name?.stringValue || '',
        email: data.fields.email?.stringValue || '',
        profile: data.fields.profile?.integerValue || 
                data.fields.profile?.stringValue || 0
      };
    } catch (error) {
      console.error('Fehler beim Abrufen der Benutzerdaten:', error);
      return null;
    }
  }

  /**
   * Aktualisiert das Benutzerprofil
   */
  async updateProfile(updates: Partial<UserProfile>): Promise<boolean> {
    const currentUser = this.currentUser;
    
    if (!currentUser) return false;
    
    // Für Gäste nur lokal speichern
    if (currentUser.isGuest) {
      if (updates.name) {
        localStorage.setItem('guest_name', updates.name);
      }
      
      if (updates.profile !== undefined) {
        localStorage.setItem('guest_profile', updates.profile.toString());
      }
      
      // User aktualisieren
      this.userSubject.next({
        ...currentUser,
        ...updates,
        profileImage: updates.profile !== undefined 
          ? this.getAvatarPath(updates.profile) 
          : currentUser.profileImage
      });
      
      return true;
    }
    
    // Für reguläre Benutzer an Server senden
    try {
      const firestoreData: any = { fields: {} };
      
      if (updates.name) {
        firestoreData.fields.name = { stringValue: updates.name };
      }
      
      if (updates.profile !== undefined) {
        firestoreData.fields.profile = { integerValue: updates.profile };
      }
      
      if (Object.keys(firestoreData.fields).length === 0) {
        return true;
      }
      
      const fieldsToUpdate = Object.keys(firestoreData.fields);
      const updateMaskPath = fieldsToUpdate
        .map(field => `updateMask.fieldPaths=${field}`)
        .join('&');
      
      const response = await fetch(`${this.urlService.BASE_URL}/users/${currentUser.id}?${updateMaskPath}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(firestoreData)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP-Fehler: ${response.status}`);
      }
      
      // Lokale Werte cachen
      if (updates.name) {
        localStorage.setItem('user_name', updates.name);
      }
      
      if (updates.profile !== undefined) {
        localStorage.setItem('user_profile_index', updates.profile.toString());
      }
      
      // User aktualisieren
      this.userSubject.next({
        ...currentUser,
        ...updates,
        profileImage: updates.profile !== undefined 
          ? this.getAvatarPath(updates.profile) 
          : currentUser.profileImage
      });
      
      return true;
    } catch (error) {
      console.error('Fehler beim Aktualisieren des Profils:', error);
      return false;
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

  private getAvatarPath(index: number): string {
    const validIndex = Number(index);
    
    if (validIndex >= 0 && validIndex < this.avatarPaths.length) {
      return this.avatarPaths[validIndex];
    }
    
    return this.avatarPaths[0];
  }

  // Getter-Methoden
  isGuest(): boolean {
    return this.currentUser?.isGuest || false;
  }

  getName(): string {
    return this.currentUser?.name || '';
  }

  getEmail(): string {
    return this.currentUser?.email || '';
  }

  getProfileImage(): string {
    return this.currentUser?.profileImage || '';
  }

  getUserId(): string {
    return this.currentUser?.id || '';
  }

  // Setter-Methoden
  setName(name: string): void {
    const currentUser = this.currentUser;
    if (currentUser) {
      this.userSubject.next({
        ...currentUser,
        name: name
      });
      
      // Auch im localStorage speichern
      if (currentUser.isGuest) {
        localStorage.setItem('guest_name', name);
      } else {
        localStorage.setItem('user_name', name);
      }
    }
  }

  async setUserId(userId: string): Promise<void> {
    localStorage.setItem('userId', userId);
    await this.loadUser(userId);
  }

  // Delete-Methoden
  async deleteUserId(): Promise<void> {
    localStorage.removeItem('userId');
    const currentUser = this.currentUser;
    if (currentUser) {
      this.userSubject.next({
        ...currentUser,
        id: ''
      });
    }
  }
  
  async deleteUserName(): Promise<void> {
    localStorage.removeItem('user_name');
    localStorage.removeItem('guest_name');
    const currentUser = this.currentUser;
    if (currentUser) {
      this.userSubject.next({
        ...currentUser,
        name: ''
      });
    }
  }

  /**
   * Löscht alle Benutzerdaten
   */
  clear(): void {
    this.userSubject.next(null);
    console.log('🧹 Benutzerdaten gelöscht');
  }
}