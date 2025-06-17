import { CommonModule } from '@angular/common';
import { Component, inject, Input } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { RouterModule, Router } from '@angular/router';
import { UserDataService } from '../../services/user_data.service';
import { UrlService } from '../../services/url.service';
@Component({
  selector: 'app-password-reset',
  standalone: true,
  imports: [MatButtonModule, FormsModule, CommonModule, RouterModule],
  templateUrl: './password-reset.component.html',
  styleUrl: './password-reset.component.scss',
})
export class PasswordResetComponent {
  @Input() disabled: boolean = false;

  constructor(
    private router: Router,
    private userDataService: UserDataService,
    private urlService: UrlService
  ) {}

  contactData = {
    password: '',
    passwordMatch: '',
  };

  isConfirmed = false;

  isDuplicate = false;

  BASE_URL = this.urlService.BASE_URL;

  path: string = '';

  userId: string = '';

  ngOnInit() {
    {
      this.userId = this.userDataService.getUserId();
    }
  }

  passwordsMatch(): boolean {
    return this.contactData.password === this.contactData.passwordMatch;
  }

  toggleConfirm() {
    this.isConfirmed = true;
    setTimeout(() => {
      this.isConfirmed = false;
    }, 3000);
  }

  async onSubmit(ngForm: NgForm) {
    this.updatePassword();
  }

  async updatePassword() {
    this.path = this.BASE_URL + '/users/' + this.userId;
    const firestoreData = {
      fields: {
        password: { string: this.contactData.password },
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
