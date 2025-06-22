import { Component, OnInit, inject } from '@angular/core';
import { RouterModule, Router } from '@angular/router';
import { UserDataService } from '../../services/user_data.service';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { AvatarService } from '../../services/avatar.service';
import { UrlService } from '../../services/url.service';
import { CreateUserComponent } from '../../overlay/create-user/create-user.component';

@Component({
  selector: 'app-avatar-selection',
  standalone: true,
  imports: [RouterModule, CommonModule, MatButtonModule, CreateUserComponent],
  templateUrl: './avatar-selection.component.html',
  styleUrl: './avatar-selection.component.scss',
})
export class AvatarSelectionComponent {
  constructor(
    private router: Router,
    private userDataService: UserDataService,
    private avatarService: AvatarService,
    private urlService: UrlService
  ) {}

  showOverlay: boolean = false;

  profileArray: string[] = [];

  selectedAvatar: string = '';

  userName: string = '';

  userId: string = '';

  avatarIndex: number = 0;

  BASE_URL = this.urlService.BASE_URL;

  path: string = '';

  ngOnInit() {
    {
      this.userName = this.userDataService.getName();
    }
    {
      this.selectedAvatar = this.avatarService.selectedAvatar;
    }
    {
      this.profileArray = this.avatarService.profileArray;
    }
    {
      this.userId = this.userDataService.getUserId();
    }
  }

  async successMove() {
    await this.sendAvatar();
    await this.deleteData();
    await this.openDialog();
    this.router.navigate(['/']);
  }

  async showSuccessNote() {}

  changeAvatar(i: number): void {
    this.selectedAvatar = this.profileArray[i];
    this.avatarIndex = i;
  }

  // Diese Methode aktualisieren/überprüfen:

async sendAvatar() {
  this.path = this.BASE_URL + '/users/' + this.userId;
  
  console.log(`Sende Avatar-Index ${this.avatarIndex} für Benutzer ${this.userId} an Firebase`);
  
  const firestoreData = {
    fields: {
      profile: { integerValue: this.avatarIndex },
    },
  };
  
  console.log("Sende Daten an Firebase:", firestoreData);
  
  const response = await fetch(`${this.path}?updateMask.fieldPaths=profile`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(firestoreData),
  });
  
  if (!response.ok) {
    console.error(`HTTP Fehler! Status: ${response.status}`);
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  
  const result = await response.json();
  console.log("Firebase-Antwort nach Avatar-Update:", result);
  
  // WICHTIG: Auch im localStorage für zukünftige Logins speichern
  localStorage.setItem('user_profile_index', this.avatarIndex.toString());
  console.log(`Avatar-Index ${this.avatarIndex} im localStorage gespeichert`);
  
  return result;
}

// WICHTIG: Falls es eine deleteData Methode gibt, muss sie NICHT den Avatar-Index löschen
async deleteData() {
  console.log("deleteData aufgerufen - Avatar-Index bleibt erhalten");
  // Vorhandenen Avatar-Index sichern
  const savedAvatarIndex = localStorage.getItem('user_profile_index');
  
  this.userId = '';
  this.userName = '';
  await this.userDataService.deleteUserId();
  await this.userDataService.deleteUserName();
  
  // WICHTIG: Avatar-Index nach dem Löschen wiederherstellen
  if (savedAvatarIndex) {
    localStorage.setItem('user_profile_index', savedAvatarIndex);
    console.log(`Avatar-Index ${savedAvatarIndex} nach dem Löschen wiederhergestellt`);
  }
}

  async openDialog(): Promise<void> {
    this.showOverlay = true;
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }
}
