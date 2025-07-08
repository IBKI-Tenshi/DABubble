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
      console.log('Kein Benutzer-ID gefunden, kann Benutzer nicht laden');
      return;
    }
    
    try {
      const response = await fetch(`${this.urlService.BASE_URL}/users/${id}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const userData = await response.json();
      
      if (!userData?.fields) {
        console.error('Keine Felder in Benutzerdaten gefunden');
        return;
      }
      
      const profileIndex = parseInt(userData.fields.profile?.integerValue || '0');
      const profileImage = this.getAvatarPath(profileIndex);
      const isGuest = userData.fields.isGuest?.booleanValue || id === 'guest';
      
      const user: UserProfile = {
        id: id,
        name: userData.fields.name?.stringValue || 'Unbekannt',
        email: userData.fields.email?.stringValue || '',
        profileImage: profileImage,
        profile: profileIndex,
        isGuest: isGuest
      };
      
      this.userSubject.next(user);
      
      // Lokalen Speicher aktualisieren
      if (isGuest) {
        localStorage.setItem('slack_clone_guest_name', user.name);
        localStorage.setItem('slack_clone_guest_profile_index', profileIndex.toString());
      } else {
        localStorage.setItem('slack_clone_user_name', user.name);
        localStorage.setItem('slack_clone_user_profile_index', profileIndex.toString());
        localStorage.setItem('slack_clone_user_email', user.email);
      }
      localStorage.setItem('slack_clone_user_id', id);
      
      console.log('Benutzer geladen:', user);
    } catch (error) {
      console.error('Fehler beim Laden des Benutzers:', error);
    }
  }

  // Gast-Profil direkt aus Firestore laden
  async loadGuestProfile(): Promise<void> {
    await this.loadUser('guest');
  }

  // Avatar aktualisieren (funktioniert für Gast und normale Benutzer)
  async updateAvatar(avatarIndex: number): Promise<boolean> {
    const currentUser = this.currentUser;
    if (!currentUser) {
      console.error('Kein aktueller Benutzer gefunden');
      return false;
    }

    try {
      // Für Gäste UND normale Benutzer: Firestore aktualisieren
      const success = await this.updateProfile({ profile: avatarIndex });
      
      if (success && currentUser.isGuest) {
        // Zusätzlich lokalen Speicher für Gäste aktualisieren
        localStorage.setItem('slack_clone_guest_profile_index', avatarIndex.toString());
      }
      
      return success;
    } catch (error) {
      console.error('Fehler beim Aktualisieren des Avatars:', error);
      return false;
    }
  }

  async updateProfile(data: { name?: string; profile?: number }): Promise<boolean> {
    try {
      const currentUser = this.userSubject.getValue();
      
      if (!currentUser) {
        console.error('Kein aktueller Benutzer gefunden');
        return false;
      }
    
      const profileIndex = data.profile !== undefined ? data.profile : currentUser.profile;
      const newProfileImage = this.getAvatarPath(profileIndex);
      const updatedProfile = {
        ...currentUser,
        name: data.name !== undefined ? data.name : currentUser.name,
        profile: profileIndex,
        profileImage: newProfileImage
      };
      
      try {
        const userId = currentUser.id;
        
        if (!userId) {
          console.error('Benutzer-ID ist leer');
          return false;
        }
        
        const firestoreData: {
          fields: Record<string, { stringValue?: string; integerValue?: number }>
        } = {
          fields: {}
        };
        
        const updateMaskFields: string[] = [];
        
        if (data.name !== undefined) {
          firestoreData.fields['name'] = { stringValue: updatedProfile.name };
          updateMaskFields.push('name');
        }
        
        if (data.profile !== undefined) {
          firestoreData.fields['profile'] = { integerValue: updatedProfile.profile };
          updateMaskFields.push('profile');
        }
        
        const updateMaskParams = updateMaskFields.map(field => `updateMask.fieldPaths=${field}`).join('&');
        const url = `${this.urlService.BASE_URL}/users/${userId}?${updateMaskParams}`;

        const response = await fetch(url, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(firestoreData)
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('Firestore Error:', errorText);
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        // Lokalen Speicher aktualisieren
        if (currentUser.isGuest) {
          localStorage.setItem('slack_clone_guest_name', updatedProfile.name);
          localStorage.setItem('slack_clone_guest_profile_index', updatedProfile.profile.toString());
        } else {
          localStorage.setItem('slack_clone_user_name', updatedProfile.name);
          localStorage.setItem('slack_clone_user_profile_index', updatedProfile.profile.toString());
        }
        
        this.userSubject.next(updatedProfile);
        console.log('Profil erfolgreich aktualisiert:', updatedProfile);
        return true;
      } catch (error) {
        console.error('Fehler beim Aktualisieren des Profils:', error);
        return false;
      }
    } catch (error) {
      console.error('Fehler beim Aktualisieren des Profils:', error);
      return false;
    }
  }

  // Gast-Name für Session aktualisieren (temporär, wird bei Logout zurückgesetzt)
  async updateGuestSessionName(sessionName: string): Promise<boolean> {
    const currentUser = this.currentUser;
    if (!currentUser || !currentUser.isGuest) {
      return false;
    }

    // Nur lokalen Zustand aktualisieren, nicht Firestore
    const updatedProfile = {
      ...currentUser,
      name: sessionName
    };

    localStorage.setItem('slack_clone_guest_session_name', sessionName);
    this.userSubject.next(updatedProfile);
    
    console.log('Gast-Session-Name aktualisiert:', sessionName);
    return true;
  }

  private getAvatarPath(index: number): string {
    const validIndex = Number(index);
    
    if (validIndex >= 0 && validIndex < this.avatarPaths.length) {
      return this.avatarPaths[validIndex];
    }
    
    return this.avatarPaths[0];
  }

  // Kompatibilitätsmethoden
  isGuest(): boolean {
    return this.currentUser?.isGuest || false;
  }

  getName(): string {
    const currentUser = this.currentUser;
    if (!currentUser) return '';
    
    // Für Gäste: Session-Name hat Priorität über Firestore-Name
    if (currentUser.isGuest) {
      const sessionName = localStorage.getItem('slack_clone_guest_session_name');
      return sessionName || currentUser.name;
    }
    
    return currentUser.name;
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

  setName(name: string): void {
    const currentUser = this.currentUser;
    if (currentUser) {
      if (currentUser.isGuest) {
        // Für Gäste: Nur Session-Name setzen
        this.updateGuestSessionName(name);
      } else {
        // Für normale Benutzer: Profil aktualisieren
        this.updateProfile({ name: name });
      }
    }
  }

  async setUserId(userId: string): Promise<void> {
    localStorage.setItem('slack_clone_user_id', userId);
    await this.loadUser(userId);
  }

  async deleteUserId(): Promise<void> {
    localStorage.removeItem('slack_clone_user_id');
    this.userSubject.next(null);
  }
  
  async deleteUserName(): Promise<void> {
    localStorage.removeItem('slack_clone_user_name');
    localStorage.removeItem('slack_clone_guest_session_name');
    
    const currentUser = this.currentUser;
    if (currentUser) {
      if (currentUser.isGuest) {
        // Gast-Namen auf Firestore-Standard zurücksetzen
        await this.loadGuestProfile();
      } else {
        this.userSubject.next({
          ...currentUser,
          name: ''
        });
      }
    }
  }

  clear(): void {
    localStorage.removeItem('slack_clone_user_id');
    localStorage.removeItem('slack_clone_user_name');
    localStorage.removeItem('slack_clone_user_email');
    localStorage.removeItem('slack_clone_user_profile_index');
    localStorage.removeItem('slack_clone_guest_session_name');
    localStorage.removeItem('slack_clone_guest_name');
    localStorage.removeItem('slack_clone_guest_profile_index');
    this.userSubject.next(null);
  }
}