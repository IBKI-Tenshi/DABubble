import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class UserIdService {
  private userId: string | null = null;
  private userName: string | null = null;

  setUserId(uid: string): void {
    this.userId = uid;
    localStorage.setItem('userId', uid);
  }

  getUserId(): string | null {
    if (!this.userId) {
      this.userId = localStorage.getItem('userId');
    }
    return this.userId;
  }

  setUserName(userName: string): void {
    this.userName = userName;
    localStorage.setItem('userName', userName);
  }

  getUserName(): string | null {
    if (!this.userName) {
      this.userName = localStorage.getItem('userName');
    }
    return this.userName;
  }

  clear(): void {
    this.userId = null;
    this.userName = null;
    localStorage.removeItem('userId');
    localStorage.removeItem('userName');
  }
}
