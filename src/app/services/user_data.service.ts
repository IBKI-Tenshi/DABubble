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
      return;
    }
    
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
        
        localStorage.setItem('slack_clone_user_name', user.name);
        localStorage.setItem('slack_clone_user_profile_index', profileIndex.toString());
        
        this.userSubject.next(user);
      } else {
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
        }
      }
    } catch (error) {
      console.error('Fehler beim Laden des Benutzers:', error);
    }
  }

  loadGuestProfile(): void {
    const guestName = localStorage.getItem('slack_clone_guest_name') || 'Gast';
    const guestProfileIndex = parseInt(localStorage.getItem('slack_clone_guest_profile_index') || '0');
    
    const profileImage = this.getAvatarPath(guestProfileIndex);
    
    const guestProfile: UserProfile = {
      id: 'guest',
      name: guestName,
      email: 'guest@example.com',
      profileImage: profileImage,
      profile: guestProfileIndex,
      isGuest: true
    };
    
    this.userSubject.next(guestProfile);
  }

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

  async updateProfile(data: { name?: string; profile?: number }): Promise<boolean> {
    try {
      const currentUser = this.userSubject.getValue();
      
      if (!currentUser) {
        return false;
      }
      
      if (currentUser.isGuest) {
        const updatedProfile: UserProfile = {
          ...currentUser,
          name: data.name !== undefined ? data.name : currentUser.name,
          profile: data.profile !== undefined ? data.profile : currentUser.profile,
          profileImage: data.profile !== undefined ? this.getAvatarPath(data.profile) : currentUser.profileImage
        };
        
        localStorage.setItem('slack_clone_guest_name', updatedProfile.name);
        localStorage.setItem('slack_clone_guest_profile_index', updatedProfile.profile.toString());
        
        this.userSubject.next(updatedProfile);
        
        return true;
      }
      
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

  setName(name: string): void {
    const currentUser = this.currentUser;
    if (currentUser) {
      this.userSubject.next({
        ...currentUser,
        name: name
      });
      
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

  clear(): void {
    this.userSubject.next(null);
  }
}