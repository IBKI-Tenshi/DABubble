import { Component, Inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { ProfileEditComponent } from './profile-edit/profile.edit.component';

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

  constructor(
    private dialogRef: MatDialogRef<ProfileComponent>,
    private dialog: MatDialog,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) { 
    this.userName = data?.name || '';
    this.userEmail = data?.email || '';
    this.profileImage = data?.profileImage || '../../../assets/img/avatar/default.png';
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
        profileImage: this.profileImage
      }
    });

    editDialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.dialog.open(ProfileComponent, {
          width: '500px',
          panelClass: 'profile-dialog-container',
          data: result
        });
      } else {
        this.dialog.open(ProfileComponent, {
          width: '500px',
          panelClass: 'profile-dialog-container',
          data: {
            name: this.userName,
            email: this.userEmail,
            profileImage: this.profileImage
          }
        });
      }
    });
  }
}