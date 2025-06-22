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
  userHasSelectedNewAvatar: boolean = false;

  constructor(
    private dialogRef: MatDialogRef<ProfileEditComponent>,
    private userDataService: UserDataService,
    private avatarService: AvatarService,
    private snackBar: MatSnackBar,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    console.log("Profil-Editor gestartet mit Daten:", data);
    
    this.avatarList = this.avatarService.profileArray;
    this.isGuestUser = localStorage.getItem('guest_token') !== null;
    
    // Avatar-Logik
    this.currentAvatar = data?.profileImage || '/assets/img/dummy_pic.png';
    console.log("Erhaltenes Profilbild:", this.currentAvatar);
    
    // WICHTIG: Verbesserte Logik für Avatar-Index
    if (data && data.profile !== undefined) {
      // Wenn ein expliziter Index mitgegeben wird
      this.selectedAvatarIndex = data.profile;
      console.log(`Avatar-Index direkt aus Daten verwendet: ${this.selectedAvatarIndex}`);
      
      // Stelle sicher, dass Index gültig ist
      if (this.selectedAvatarIndex < 0 || this.selectedAvatarIndex >= this.avatarList.length) {
        console.warn(`Ungültiger Avatar-Index ${this.selectedAvatarIndex}, setze auf 0`);
        this.selectedAvatarIndex = 0;
      }
      
      // Aktualisiere currentAvatar basierend auf dem Index
      this.currentAvatar = this.avatarList[this.selectedAvatarIndex];
    } else {
      // Versuche, den Index aus dem Pfad abzuleiten
      this.selectedAvatarIndex = this.avatarList.findIndex(avatar => avatar === this.currentAvatar);
      console.log(`Index aus Pfad abgeleitet: ${this.selectedAvatarIndex}`);
      
      // Wenn nichts gefunden wurde, nutze Fallbacks
      if (this.selectedAvatarIndex === -1) {
        if (this.isGuestUser) {
          const savedIndex = localStorage.getItem('guest_avatar_index');
          if (savedIndex !== null) {
            this.selectedAvatarIndex = parseInt(savedIndex);
            console.log(`Avatar-Index für Gast aus localStorage: ${this.selectedAvatarIndex}`);
          } else {
            this.selectedAvatarIndex = 0;
            console.log("Kein Avatar-Index gefunden, Standard: 0");
          }
        } else {
          // Für reguläre Benutzer
          const currentUser = this.userDataService.currentUserValue;
          if (currentUser && currentUser.profile !== undefined) {
            this.selectedAvatarIndex = currentUser.profile;
            console.log(`Avatar-Index aus UserDataService: ${this.selectedAvatarIndex}`);
          } else {
            this.selectedAvatarIndex = 0;
            console.log("Kein Avatar-Index gefunden, Standard: 0");
          }
        }
      }
      
      // Stelle sicher, dass das Profilbild dem gewählten Index entspricht
      if (this.selectedAvatarIndex >= 0 && this.selectedAvatarIndex < this.avatarList.length) {
        this.currentAvatar = this.avatarList[this.selectedAvatarIndex];
      }
    }
    
    // Name für das Formular
    let initialName = data?.name || '';
    if (this.isGuestUser && !initialName) {
      initialName = localStorage.getItem('guest_name') || 'Frederik Leck';
    }
    
    this.profileForm = new FormGroup({
      name: new FormControl(initialName, [Validators.required, this.noLeadingSpaceValidator])
    });
    
    console.log(`Profil-Editor initialisiert mit Name: ${initialName}, Avatar-Index: ${this.selectedAvatarIndex}`);
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
    this.userHasSelectedNewAvatar = true;
    console.log(`Avatar ${index} ausgewählt`);
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
        
        console.log(`Speichere Profiländerungen: Name=${newName}, Avatar=${this.selectedAvatarIndex}`);
        
        // Für sofortige lokale UI-Updates
        this.userDataService.setName(newName);
        
        // WICHTIG: Avatar immer mitschicken - kein Flag-Check mehr
        const updates: any = { 
          name: newName,
          profile: this.selectedAvatarIndex
        };
        
        const success = await this.userDataService.updateUserProfile(userId, updates);
        
        if (success) {
          const message = this.isGuestUser 
            ? 'Gast-Profil gespeichert' 
            : 'Profil erfolgreich gespeichert';
          
          this.snackBar.open(message, 'OK', { duration: 2000 });
          
          // WICHTIG: Explizit den Avatar-Index mitgeben
          this.dialogRef.close({
            name: newName,
            email: this.data.email,
            profileImage: this.currentAvatar,
            profile: this.selectedAvatarIndex
          });
          
          console.log("Profil gespeichert, Avatar-Index:", this.selectedAvatarIndex);
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