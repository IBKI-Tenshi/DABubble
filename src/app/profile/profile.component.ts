import { Component, Inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { ProfileEditComponent } from './profile-edit/profile.edit.component';
import { UserDataService } from '../services/user_data.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    MatButtonModule, 
    MatDialogModule, 
    MatIconModule,
    CommonModule
  ],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss',
})
export class ProfileComponent {
  userName: string;
  userEmail: string;
  profileImage: string;
  isGuestUser: boolean;
  lastLogin: string;
  profileIndex: number;

  constructor(
    private dialogRef: MatDialogRef<ProfileComponent>,
    private dialog: MatDialog,
    private userDataService: UserDataService,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) { 
    this.isGuestUser = localStorage.getItem('guest_token') !== null;
    
    if (this.data) {
      this.userName = data.name || '';
      this.userEmail = data.email || '';
      this.profileImage = data.profileImage || '';
      this.profileIndex = data.profile !== undefined ? data.profile : 0;
    } else {
      const currentUser = this.userDataService.currentUser;
      if (currentUser) {
        this.userName = currentUser.name;
        this.userEmail = currentUser.email;
        this.profileImage = currentUser.profileImage;
        this.profileIndex = currentUser.profile;
      } else {
        this.userName = 'Gast';
        this.userEmail = 'guest@example.com';
        this.profileImage = '/assets/img/avatar/avatar_1.png';
        this.profileIndex = 0;
      }
    }
    
    this.lastLogin = data?.lastLogin || this.getFormattedDate();
  }

  private getFormattedDate(): string {
    const now = new Date();
    return now.getUTCFullYear() + '-' + 
           String(now.getUTCMonth() + 1).padStart(2, '0') + '-' +
           String(now.getUTCDate()).padStart(2, '0') + ' ' +
           String(now.getUTCHours()).padStart(2, '0') + ':' +
           String(now.getUTCMinutes()).padStart(2, '0') + ':' +
           String(now.getUTCSeconds()).padStart(2, '0');
  }

  closeDialog(): void {
    this.dialogRef.close();
  }

  openEditProfile(): void {
    this.dialogRef.close();
    
    const editDialogRef = this.dialog.open(ProfileEditComponent, {
      width: '500px',
      panelClass: 'profile-edit-dialog-container',
      data: {
        name: this.userName,
        email: this.userEmail,
        profileImage: this.profileImage,
        profile: this.profileIndex,
        isGuest: this.isGuestUser
      }
    });

    editDialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.dialog.open(ProfileComponent, {
          width: '500px',
          panelClass: 'profile-dialog-container',
          data: {
            name: result.name,
            email: result.email || this.userEmail,
            profileImage: result.profileImage,
            profile: result.profile,
            lastLogin: this.lastLogin
          }
        });
      } else {
        this.dialog.open(ProfileComponent, {
          width: '500px',
          panelClass: 'profile-dialog-container',
          data: {
            name: this.userName,
            email: this.userEmail,
            profileImage: this.profileImage,
            profile: this.profileIndex,
            lastLogin: this.lastLogin
          }
        });
      }
    });
  }
}