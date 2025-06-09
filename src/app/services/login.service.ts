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
    return !!localStorage.getItem('google_token');
  }

  login() {
    this.loggedIn.next(true);
  }

  logout() {
    localStorage.removeItem('google_token');
    this.loggedIn.next(false);
  }
}
