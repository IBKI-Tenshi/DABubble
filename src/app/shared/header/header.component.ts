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
import { Observable, Subscription } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { FirestoreService } from '../../services/firestore.service';

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
    MatInputModule,
    FormsModule,
  ],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
})
export class HeaderComponent implements OnInit, OnDestroy {
  userName: string = '';
  userEmail: string = '';
  userImage: string = '/assets/img/dummy_pic.png';
  isGuestUser: boolean = true;
  channels: any[] = [];
  searchTerm: string = '';
  filteredChannels: any[] = [];

  private subscription: Subscription = new Subscription();

  constructor(
    private dialog: MatDialog,
    private router: Router,
    private loginService: LoginService,
    private userDataService: UserDataService,
    private cdr: ChangeDetectorRef,
    private firestoreService: FirestoreService
  ) {}

  ngOnInit() {
    this.firestoreService.getAllChats().subscribe((docs) => {
      this.channels = docs.map((doc) => doc.name);
      this.filteredChannels = this.channels;
    });

    this.subscription = this.userDataService.user$.subscribe((user) => {
      setTimeout(() => {
        this.updateUserData(user);
        this.cdr.detectChanges();
      }, 0);
    });
  }

  onSearchChange() {
    if (!this.searchTerm.trim()) {
      // wenn leer → nichts anzeigen
      this.filteredChannels = [];
      return;
    }

    this.filteredChannels = this.channels.filter(
      (channel) =>
        channel.name.toLowerCase().includes(this.searchTerm.toLowerCase()),
      console.log(this.filteredChannels)
    );
  }

  private initializeUserData() {
    this.isGuestUser = localStorage.getItem('guest_token') !== null;

    if (this.isGuestUser) {
      this.userName = localStorage.getItem('guest_name') || 'Frederik Beck';
      this.userEmail = 'frederik.beck@example.com';
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
    } else {
      this.initializeUserData();
    }

    this.cdr.detectChanges();
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  openProfileDialog() {
    const currentlyGuest = localStorage.getItem('guest_token') !== null;

    const dialogRef = this.dialog.open(ProfileComponent, {
      width: '500px',
      panelClass: 'profile-dialog-container',
      data: {
        name: this.userName,
        email: this.userEmail,
        profileImage: this.userImage,
        isGuest: currentlyGuest,
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
      }
    });
  }

  LogOut() {
    this.loginService.logout();
    this.router.navigate(['/']);
  }
}
