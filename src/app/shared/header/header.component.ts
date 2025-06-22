import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy } from '@angular/core';
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
  userName: string = ''; // Leer für Anfang
  userEmail: string = '';
  userImage: string = '/assets/img/dummy_pic.png';
  isGuestUser: boolean = true; // Standard: Gast
  private subscription: Subscription = new Subscription();

  constructor(
    private dialog: MatDialog,
    private router: Router,
    private loginService: LoginService,
    private userDataService: UserDataService
  ) {
    console.log("Header-Komponente wird initialisiert");
  }

  ngOnInit() {
    console.log("Header OnInit: Abonniere Benutzer-Updates");
    
    this.isGuestUser = localStorage.getItem('guest_token') !== null;
    
    // Für Gäste den gespeicherten Namen verwenden
    if (this.isGuestUser) {
      this.userName = localStorage.getItem('guest_name') || 'Frederik Leck';
      this.userEmail = 'frederik.leck@example.com';
      console.log("Gast erkannt, setze Namen:", this.userName);
    }
    
    // Überwache Änderungen am Benutzerprofil
    this.subscription = this.userDataService.user$.subscribe(user => {
      console.log("Neues Benutzer-Update empfangen:", user);

      const currentlyGuest = localStorage.getItem('guest_token') !== null;
      
      if (user) {
        // Für Gäste den aktuellen Namen aus dem Update verwenden
        if (currentlyGuest) {
          this.userName = user.name || localStorage.getItem('guest_name') || 'Frederik Leck';
          this.userEmail = 'frederik.leck@example.com';
          console.log("Gast-Update erkannt, setze Namen:", this.userName);
        } else {
          // WICHTIG: Verwende den originalen Namen - keine Verarbeitung
          this.userName = user.name || '';
          this.userEmail = user.email || localStorage.getItem('user_email') || '';
          console.log(`Benutzer-Update: ${this.userName}, ${this.userEmail}`);
        }
        
        this.userImage = user.profileImage || '/assets/img/dummy_pic.png';
        this.isGuestUser = currentlyGuest;
      } else {
        this.isGuestUser = currentlyGuest;
        
        if (this.isGuestUser) {
          this.userName = localStorage.getItem('guest_name') || 'Frederik Leck';
          this.userEmail = 'frederik.leck@example.com';
          console.log("Kein Benutzer-Update, aber Gast erkannt:", this.userName);
        } else {
          // WICHTIG: Verwende den Namen aus localStorage, falls vorhanden, ohne Manipulation
          const storedName = localStorage.getItem('user_name');
          if (storedName) {
            this.userName = storedName; // Name exakt wie gespeichert verwenden
          } else {
            // Als Fallback die E-Mail-Adresse ohne Manipulation verwenden
            const storedEmail = localStorage.getItem('user_email');
            this.userEmail = storedEmail || '';
            
            // Nur wenn wir absolut nichts haben, leeren Namen setzen
            if (!this.userName) {
              this.userName = '';
            }
          }
          console.log("Kein Benutzer und kein Gast, Name:", this.userName);
        }
      }
    });
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