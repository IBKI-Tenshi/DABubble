import { Component, Inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { 
  FormControl, 
  FormGroup, 
  ReactiveFormsModule, 
  Validators, 
  AbstractControl, 
  ValidationErrors 
} from '@angular/forms';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { UserDataService } from '../../services/user_data.service';
import { AvatarService } from '../../services/avatar.service';

@Component({
  selector: 'app-profile-edit',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatDialogModule,
    MatIconModule,
    ReactiveFormsModule,
    MatExpansionModule,
    MatSnackBarModule
  ],
  templateUrl: './profile.edit.component.html',
  styleUrl: './profile.edit.component.scss'
})
export class ProfileEditComponent {
  profileForm: FormGroup;
  currentAvatar: string;
  isSubmitting = false;
  avatarList: string[];
  selectedAvatarIndex: number = 0;
  errorMessage: string = '';
  isGuestUser: boolean = false;

  constructor(
    private dialogRef: MatDialogRef<ProfileEditComponent>,
    private userDataService: UserDataService,
    private avatarService: AvatarService,
    private snackBar: MatSnackBar,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.currentAvatar = data?.profileImage || '/assets/img/avatar/default.png';
    this.avatarList = this.avatarService.profileArray;
    this.isGuestUser = this.userDataService.isGuest();
    
    this.selectedAvatarIndex = this.avatarList.findIndex(avatar => avatar === this.currentAvatar);
    if (this.selectedAvatarIndex === -1) this.selectedAvatarIndex = 0;
    
    this.profileForm = new FormGroup({
      name: new FormControl(data?.name || 'Frederik Beck', [Validators.required, this.noLeadingSpaceValidator])
    });
  }

  noLeadingSpaceValidator(control: AbstractControl): ValidationErrors | null {
    if (control.value && typeof control.value === 'string' && control.value.charAt(0) === ' ') {
      return { leadingSpace: true };
    }
    return null;
  }

  selectAvatar(path: string, index: number): void {
    this.currentAvatar = path;
    this.selectedAvatarIndex = index;
  }

  closeEditForm(): void {
    this.dialogRef.close();
  }

  async saveChanges(): Promise<void> {
    if (this.profileForm.valid && !this.isSubmitting) {
      this.isSubmitting = true;
      this.errorMessage = '';
      
      try {
        const newName = this.profileForm.get('name')?.value;
        const userId = this.userDataService.getUserId();
        
        this.userDataService.setName(newName);

        const success = await this.userDataService.updateUserProfile(userId, { 
          name: newName,
          profile: this.selectedAvatarIndex 
        });
        
        if (success) {
          const message = this.isGuestUser 
            ? 'Profil lokal gespeichert (Gast-Modus)'
            : 'Profil erfolgreich gespeichert';
          
          this.snackBar.open(message, 'OK', { duration: 2000 });
          
          this.dialogRef.close({
            name: newName,
            email: this.data.email,
            profileImage: this.currentAvatar
          });
        } else {
          this.errorMessage = 'Fehler beim Speichern des Profils';
          this.snackBar.open(this.errorMessage, 'OK', { duration: 3000 });
        }
      } catch (error) {
        this.errorMessage = 'Unerwarteter Fehler beim Speichern des Profils';
        console.error('Fehler beim Speichern des Profils', error);
        this.snackBar.open(this.errorMessage, 'OK', { duration: 3000 });
      } finally {
        this.isSubmitting = false;
      }
    } else {
      this.profileForm.markAllAsTouched();
    }
  }

  checkForBlankFirst(name: string | null): boolean {
    return !!name && name.charAt(0) === ' ';
  }
}