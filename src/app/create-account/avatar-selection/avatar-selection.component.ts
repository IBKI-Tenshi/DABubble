import { Component, OnInit, inject } from '@angular/core';
import { RouterModule, Router } from '@angular/router';
import { UserIdService } from '../../services/userId.service';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { AvatarService } from '../../services/avatar.service';
import { UrlService } from '../../services/url.service';
import { CreateUserComponent } from '../../overlay/create-user.component';

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
    private userDataService: UserIdService,
    private avatarService: AvatarService,
    private urlService: UrlService
  ) {}

  showOverlay: boolean = false;

  profileArray: string[] = [];

  selectedAvatar: string = '';

  userName: string | null = '';

  userId: string | null = '';

  avatarIndex: number = 0;

  BASE_URL = this.urlService.BASE_URL;

  path: string = '';

  ngOnInit() {
    this.initializeUserData();
    this.initializeAvatarData();
  }

  initializeUserData(): void {
    this.userName = localStorage.getItem('userName');
    this.userId = localStorage.getItem('userId');
    console.log(this.userName);
    console.log(this.userId);
  }

  mySelectedAvatar() {
    console.log(this.selectedAvatar);
  }

  initializeAvatarData(): void {
    this.selectedAvatar = this.avatarService.selectedAvatar;
    this.profileArray = this.avatarService.profileArray;
  }

  async successMove() {
    await this.sendAvatar();
    await this.deleteData();
    await this.showAndNavigate();
  }

  async showAndNavigate(): Promise<void> {
    await this.openDialog();
    this.router.navigate(['/']);
  }

  async deleteData() {
    this.userDataService.clear();
  }

  async showSuccessNote() {}

  changeAvatar(i: number): void {
    this.selectedAvatar = this.profileArray[i];
    this.avatarIndex = i;
  }

  async sendAvatar() {
    this.path = this.BASE_URL + '/users/' + this.userId;
    const firestoreData = {
      fields: {
        profile: { integerValue: this.avatarIndex },
      },
    };
    const response = await fetch(`${this.path}?updateMask.fieldPaths=profile`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(firestoreData),
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  }

  async openDialog(): Promise<void> {
    this.showOverlay = true;
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }
}
