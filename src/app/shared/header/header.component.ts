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
  userName: string = 'Frederik Beck';
  userEmail: string = 'frederik.beck@example.com';
  userImage: string = '/assets/img/dummy_pic.png';
  isGuestUser: boolean = false;
  private subscription: Subscription = new Subscription();

  constructor(
    private dialog: MatDialog,
    private router: Router,
    private loginService: LoginService,
    private userDataService: UserDataService
  ) {}

  ngOnInit() {
    this.isGuestUser = this.userDataService.isGuest();
    
    this.userName = this.userDataService.getName();
    
    this.subscription = this.userDataService.user$.subscribe(user => {
      if (user) {
        this.userName = user.name || this.userName;
        this.userEmail = user.email || this.userEmail;
        this.userImage = user.profileImage || this.userImage;
        this.isGuestUser = user.isGuest || false;
      }
    });
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  openProfileDialog() {
    const dialogRef = this.dialog.open(ProfileComponent, {
      width: '500px',
      panelClass: 'profile-dialog-container',
      data: {
        name: this.userName,
        email: this.userEmail,
        profileImage: this.userImage,
        isGuest: this.isGuestUser
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        console.log('Profil wurde aktualisiert');
      }
    });
  }

  LogOut() {
    this.loginService.logout();
    this.router.navigate(['/']);
  }
}