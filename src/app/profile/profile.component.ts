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
  profileIndex: number | undefined;

  constructor(
    private dialogRef: MatDialogRef<ProfileComponent>,
    private dialog: MatDialog,
    private userDataService: UserDataService,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) { 
    console.log("Profil-Komponente gestartet mit Daten:", data);
    
    this.isGuestUser = localStorage.getItem('guest_token') !== null;
    
    if (this.isGuestUser) {
      this.userName = data?.name || localStorage.getItem('guest_name') || 'Frederik Leck';
      this.userEmail = 'frederik.leck@example.com';
      
      // Avatar-Index aus localStorage für Gäste
      this.profileIndex = data?.profile !== undefined ? 
        data.profile : 
        (localStorage.getItem('guest_avatar_index') ? 
          parseInt(localStorage.getItem('guest_avatar_index')!) : undefined);
          
      console.log("Gast erkannt im Profil, verwende:", this.userName, "Avatar-Index:", this.profileIndex);
    } else {
      this.userName = data?.name || this.userDataService.getName() || '';
      this.userEmail = data?.email || localStorage.getItem('user_email') || this.userDataService.getEmail() || '';
      
      // Avatar-Index aus Daten oder Service
      this.profileIndex = data?.profile !== undefined ? data.profile : undefined;
      
      if (this.profileIndex === undefined) {
        const currentUser = this.userDataService.currentUserValue;
        if (currentUser && currentUser.profile !== undefined) {
          this.profileIndex = currentUser.profile;
        }
      }
      
      console.log("Benutzer erkannt im Profil, Name:", this.userName, "Avatar-Index:", this.profileIndex);
    }
    
    this.profileImage = data?.profileImage || this.userDataService.getProfileImage() || '/assets/img/dummy_pic.png';
    this.lastLogin = data?.lastLogin || this.userDataService.getFormattedDate();
  }

  closeDialog(): void {
    this.dialogRef.close();
  }

  openEditProfile(): void {
    console.log("Öffne Profil-Bearbeiten mit:", {
      name: this.userName,
      email: this.userEmail,
      profileImage: this.profileImage,
      profile: this.profileIndex, // Profile-Index übergeben
      isGuest: this.isGuestUser
    });
    
    this.dialogRef.close();
    
    const editDialogRef = this.dialog.open(ProfileEditComponent, {
      width: '500px',
      panelClass: 'profile-edit-dialog-container',
      data: {
        name: this.userName,
        email: this.userEmail,
        profileImage: this.profileImage,
        profile: this.profileIndex, // Profile-Index übergeben
        isGuest: this.isGuestUser
      }
    });

    editDialogRef.afterClosed().subscribe(result => {
      if (result) {
        console.log("Edit-Dialog geschlossen mit Ergebnis:", result);
        
        const currentlyGuest = localStorage.getItem('guest_token') !== null;
        
        this.dialog.open(ProfileComponent, {
          width: '500px',
          panelClass: 'profile-dialog-container',
          data: {
            name: result.name,
            email: currentlyGuest ? 'frederik.leck@example.com' : (result.email || this.userEmail),
            profileImage: result.profileImage,
            profile: result.profile, // Profile-Index vom Ergebnis übernehmen
            isGuest: currentlyGuest,
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
            profile: this.profileIndex, // Ursprünglichen Profile-Index beibehalten
            isGuest: this.isGuestUser,
            lastLogin: this.lastLogin
          }
        });
      }
    });
  }
}