import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatToolbarModule } from '@angular/material/toolbar';
import { Router, RouterModule } from '@angular/router';
import { ProfileComponent } from '../../profile/profile.component';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { LoginService } from '../../services/login.service';
import { UserDataService } from '../../services/user_data.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    CommonModule,
    MatToolbarModule,
    MatIconModule,
    RouterModule,
    MatMenuModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule
  ],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
})
export class HeaderComponent implements OnInit, OnDestroy {
  userName: string = '';
  userEmail: string = '';
  userImage: string = '/assets/img/dummy_pic.png';
  isGuestUser: boolean = true;
  private subscription: Subscription = new Subscription();

  constructor(
    private dialog: MatDialog,
    private router: Router,
    private loginService: LoginService,
    private userDataService: UserDataService,
    private cdr: ChangeDetectorRef  // <- WICHTIG: Hinzufügen
  ) {
    console.log("Header-Komponente wird initialisiert");
  }

  ngOnInit() {
    console.log("Header OnInit: Abonniere Benutzer-Updates");
    
    // User Updates mit Verzögerung verarbeiten
    this.subscription = this.userDataService.user$.subscribe(user => {
      console.log("Neues Benutzer-Update empfangen:", user);
      
      // WICHTIG: Asynchron verarbeiten
      setTimeout(() => {
        this.updateUserData(user);
        this.cdr.detectChanges();
      }, 0);
    });
  }

  private initializeUserData() {
    this.isGuestUser = localStorage.getItem('guest_token') !== null;
    
    if (this.isGuestUser) {
      this.userName = localStorage.getItem('guest_name') || 'Frederik Leck';
      this.userEmail = 'frederik.leck@example.com';
      console.log("Gast erkannt, setze Namen:", this.userName);
    } else {
      this.userName = localStorage.getItem('user_name') || '';
      this.userEmail = localStorage.getItem('user_email') || '';
    }
  }

  private updateUserData(user: any) {
    if (user) {
      this.userName = user.name || '';
      this.userEmail = user.email || '';
      this.userImage = user.profileImage || '/assets/img/dummy_pic.png';
      this.isGuestUser = user.isGuest || false;
      console.log(`User-Update: ${this.userName}, ${this.userEmail}`);
    } else {
      // Bei null/undefined User: Auf lokale Werte prüfen
      this.initializeUserData();
    }
    
    // Manuell Change Detection auslösen
    this.cdr.detectChanges();
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
    console.log("Header-Subscription beendet");
  }

  openProfileDialog() {
    console.log(`Öffne Profil-Dialog für: ${this.userName}, ${this.userEmail}`);
    
    const currentlyGuest = localStorage.getItem('guest_token') !== null;
    
    const dialogRef = this.dialog.open(ProfileComponent, {
      width: '500px',
      panelClass: 'profile-dialog-container',
      data: {
        name: this.userName,
        email: this.userEmail,
        profileImage: this.userImage,
        isGuest: currentlyGuest
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        console.log("Profil-Dialog wurde geschlossen mit Ergebnis:", result);
      }
    });
  }

  LogOut() {
    console.log("Logout ausgeführt");
    this.loginService.logout();
    this.router.navigate(['/']);
  }
}