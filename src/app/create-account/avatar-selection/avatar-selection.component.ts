import { Component, OnInit } from '@angular/core';
import { RouterModule, Router } from '@angular/router';
import { UserDataService } from '../../services/user_data.service';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { AvatarService } from '../../services/avatar.service';
import { UrlService } from '../../services/url.service';

@Component({
  selector: 'app-avatar-selection',
  standalone: true,
  imports: [RouterModule, CommonModule, MatButtonModule],
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
    await this.showSuccessNote();
    this.router.navigate(['/']);
  }

  async deleteData() {
    this.userId = '';
    this.userName = '';
    await this.userDataService.deleteUserId();
    await this.userDataService.deleteUserName();
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
}
