import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, RouterOutlet } from '@angular/router'; // ganz wichtig damit das routing funktioniert
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';

import { LoginService } from './services/login.service';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ProfileComponent } from './profile/profile.component';
import { HeaderComponent } from './shared/header/header.component';
import { SidebarComponent } from './shared/sidebar/sidebar.component';
import { IntroComponent } from "./intro/intro.component";

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
    MatDialogModule,
    MatButtonModule,
    HeaderComponent,
    SidebarComponent,
    IntroComponent
],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  title = 'simple-crm';
  readonly dialog = inject(MatDialog);
  isLoggedIn = false;
  isLoggedIn$ = this.loginService.isLoggedIn$;
  // isLoggedIn = true;

  showSidebar = true; // Steuert Sichtbarkeit der Sidebar 


  constructor(private loginService: LoginService) { }

  ngOnInit() {
    this.loginService.isLoggedIn$.subscribe((status) => {
      this.isLoggedIn = status;
    });
  }
  openProfileDialog() {
    const dialogRef = this.dialog.open(ProfileComponent);

    dialogRef.afterClosed().subscribe((result) => {
      console.log(`Dialog result: ${result}`);
    });
  }

  toggleSidebar() {
    this.showSidebar = !this.showSidebar;
  }

}
