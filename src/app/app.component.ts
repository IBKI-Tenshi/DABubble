import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, RouterOutlet } from '@angular/router'; // ganz wichtig damit das routing funktioniert
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import {MatButtonModule} from '@angular/material/button';

import { LoginService } from './services/login.service';

// import { Firestore } from '@angular/fire/firestore';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    MatToolbarModule,
    MatSidenavModule,
    MatIconModule,
    RouterModule,
    MatMenuModule,
    MatButtonModule,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'sinmple-crm';

  isLoggedIn: boolean = false;
  // isLoggedIn = true;

  constructor(private loginService: LoginService) {
    this.loginService.isLoggedIn$.subscribe(status => {
      this.isLoggedIn = status;
    });
  }
  openProfileDialog() { }

  LogOut() { }


}
