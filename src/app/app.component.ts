import { Component, inject, ViewChild } from '@angular/core';
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
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import {
  trigger,
  transition,
  style,
  animate,
} from '@angular/animations';

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
    IntroComponent,
    FormsModule,
    ReactiveFormsModule
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  animations: [
    trigger('fadeSlideSidebar', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateX(-20px)' }),
        animate('300ms ease-out', style({ opacity: 1, transform: 'translateX(0)' }))
      ]),
      transition(':leave', [
        animate('200ms ease-in', style({ opacity: 0, transform: 'translateX(-20px)' }))
      ])
    ])
  ],
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