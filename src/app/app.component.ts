

import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, RouterOutlet, NavigationEnd } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { trigger, transition, style, animate } from '@angular/animations';
import { Subscription } from 'rxjs';

import { LoginService } from './services/login.service';
import { OrientationService } from './services/orientation.service';
import { ProfileComponent } from './profile/profile.component';
import { HeaderComponent } from './shared/header/header.component';
import { SidebarComponent } from './shared/sidebar/sidebar.component';
import { IntroComponent } from './intro/intro.component';

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
export class AppComponent implements OnInit, OnDestroy {
  title = 'simple-crm';
  readonly dialog = inject(MatDialog);
  isLoggedIn$ = this.loginService.isLoggedIn$;
  showSidebar = true;

  isMobilePortrait = false;
  private orientationSub?: Subscription;
  private routerSub?: Subscription;

  constructor(
    private loginService: LoginService,
    private router: Router,
    private orientationService: OrientationService
  ) {}

  ngOnInit(): void {
    this.orientationSub = this.orientationService.isPortrait$.subscribe(isPortrait => {
      this.isMobilePortrait = isPortrait;

      // Wenn Portrait: Sidebar beim Wechsel automatisch anzeigen
      if (isPortrait) {
        this.showSidebar = true;
      }
    });

    this.routerSub = this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd && this.isMobilePortrait) {
        this.showSidebar = false;
      }
    });
  }

  ngOnDestroy(): void {
    this.orientationSub?.unsubscribe();
    this.routerSub?.unsubscribe();
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
