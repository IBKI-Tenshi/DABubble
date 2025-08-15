import { Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';
import { UserDataService } from '../services/user_data.service';
import { filter, map, take } from 'rxjs/operators';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class LoginBlockGuard implements CanActivate {
  constructor(private user: UserDataService, private router: Router) {}

  canActivate(): Observable<boolean | UrlTree> {
    return this.user.user$.pipe(
      filter(u => u !== undefined),
      take(1),
      map(u => {
        if (u) {
          return this.router.parseUrl(this.router.url || '/channelChat/test_channel');
        }
        return true;
      })
    );
  }
}