import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, RouterOutlet } from '@angular/router';
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
  
  isLoggedIn$ = this.loginService.isLoggedIn$;
  
  showSidebar = true;

  constructor(private loginService: LoginService) {}

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