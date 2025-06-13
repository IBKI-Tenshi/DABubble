import { Component, OnInit } from '@angular/core';
import { RouterModule, Router } from '@angular/router';
import { UserDataService } from '../../services/user_data.service';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';

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
    private userDataService: UserDataService
  ) {}

  profileArray = [
    '../../../assets/img/avatar/avatar_1.png',
    '../../../assets/img/avatar/avatar_2.png',
    '../../../assets/img/avatar/avatar_3.png',
    '../../../assets/img/avatar/avatar_4.png',
    '../../../assets/img/avatar/avatar_5.png',
    '../../../assets/img/avatar/avatar_6.png',
  ];

  selectedAvatar = '../../../assets/img/avatar/default.png';

  userName: string = '';

  ngOnInit() {
    {
      this.userName = this.userDataService.getName();
    }
  }

  successMove() {
    this.router.navigate(['/']);
  }

  changeAvatar(i: number): void {
    this.selectedAvatar = this.profileArray[i];
  }
}
