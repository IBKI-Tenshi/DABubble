import { Component, Inject, ViewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { MatExpansionModule, MatExpansionPanel } from '@angular/material/expansion';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
  AbstractControl,
  ValidationErrors
} from '@angular/forms';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { UserDataService } from '../../services/user_data.service';

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
  @ViewChild('avatarSelector') avatarSelector!: MatExpansionPanel;

  profileForm: FormGroup;
  currentAvatar: string;
  isSubmitting = false;
  errorMessage = '';
  selectedAvatarIndex: number;

  avatarList: string[] = [
    '/assets/img/avatar/avatar_1.png',
    '/assets/img/avatar/avatar_2.png',
    '/assets/img/avatar/avatar_3.png',
    '/assets/img/avatar/avatar_4.png',
    '/assets/img/avatar/avatar_5.png',
    '/assets/img/avatar/avatar_6.png'
  ];

  constructor(
    private dialogRef: MatDialogRef<ProfileEditComponent>,
    private userDataService: UserDataService,
    private snackBar: MatSnackBar,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.selectedAvatarIndex = data?.profile !== undefined ? data.profile : 0;
    this.currentAvatar = data?.profileImage || this.avatarList[this.selectedAvatarIndex];

    this.profileForm = new FormGroup({
      name: new FormControl(data?.name || '', [
        Validators.required,
        this.noLeadingSpaceValidator
      ])
    });
  }

  noLeadingSpaceValidator(control: AbstractControl): ValidationErrors | null {
    return control.value &&
      typeof control.value === 'string' &&
      control.value.charAt(0) === ' ' ? { leadingSpace: true } : null;
  }

  selectAvatar(path: string, index: number): void {
    this.currentAvatar = path;
    this.selectedAvatarIndex = index;
  }

  closeEditForm(): void {
    this.dialogRef.close();
  }

  checkForBlankFirst(name: string | null): boolean {
    return !!name && name.charAt(0) === ' ';
  }

  async saveChanges(): Promise<void> {
    if (this.profileForm.invalid || this.isSubmitting) {
      this.profileForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';

    try {
      const newName = this.profileForm.get('name')?.value;
      const success = await this.userDataService.updateProfile({
        name: newName,
        profile: this.selectedAvatarIndex
      });

      if (success) {
        this.snackBar.open('Profil gespeichert', 'OK', { duration: 2000 });

        if (this.data.isGuest) {
          localStorage.setItem('slack_clone_guest_name', newName);
          localStorage.setItem('slack_clone_guest_profile_index', this.selectedAvatarIndex.toString());
          console.log('✅ Gast-Profil im localStorage gespeichert:', {
            name: newName,
            profileIndex: this.selectedAvatarIndex
          });
        }

        this.dialogRef.close({
          name: newName,
          email: this.data.email,
          profileImage: this.currentAvatar,
          profile: this.selectedAvatarIndex,
          isGuest: this.data.isGuest
        });
      } else {
        this.errorMessage = 'Fehler beim Speichern des Profils';
        this.snackBar.open(this.errorMessage, 'OK', { duration: 3000 });
      }
    } catch (error) {
      this.errorMessage = 'Unerwarteter Fehler beim Speichern des Profils';
      this.snackBar.open(this.errorMessage, 'OK', { duration: 3000 });
    } finally {
      this.isSubmitting = false;
    }
  }
}