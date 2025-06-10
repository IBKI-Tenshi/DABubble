import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class LoginService {
  private loggedIn = new BehaviorSubject<boolean>(this.hasToken());
  isLoggedIn$ = this.loggedIn.asObservable();

  constructor() {}

  private hasToken(): boolean {
    return !!(localStorage.getItem('google_token') || localStorage.getItem('guest_token'));
  }

  login(token: string = '') {
    if (token) {
      localStorage.setItem('user_token', token);
    }
    this.loggedIn.next(true);
  }

  loginAsGuest() {
    localStorage.setItem('guest_token', 'guest_dummy_token');
    this.loggedIn.next(true);
  }

  logout() {
    localStorage.removeItem('google_token');
    localStorage.removeItem('guest_token');
    localStorage.removeItem('user_token'); // für späteren normalen Login
    this.loggedIn.next(false);
  }
}
