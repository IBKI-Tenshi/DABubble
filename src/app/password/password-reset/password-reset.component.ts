import { CommonModule } from '@angular/common';
import { Component, inject, Input } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { RouterModule, Router } from '@angular/router';
import { UserDataService } from '../../services/user_data.service';
import { UrlService } from '../../services/url.service';
import { CreateUserComponent } from '../../overlay/create-user/create-user.component';
@Component({
  selector: 'app-password-reset',
  standalone: true,
  imports: [
    MatButtonModule,
    FormsModule,
    CommonModule,
    RouterModule,
    CreateUserComponent,
  ],
  templateUrl: './password-reset.component.html',
  styleUrl: './password-reset.component.scss',
})
export class PasswordResetComponent {
  @Input() disabled: boolean = false;
  showOverlay: boolean = false;

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

  async openDialog(): Promise<void> {
    this.showOverlay = true;
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }

  async deleteData() {
    this.userId = '';
    await this.userDataService.deleteUserId();
  }

  async onSubmit(ngForm: NgForm) {
    if (ngForm.valid && this.passwordsMatch()) {
      try {
        await this.updatePassword();
        await this.deleteData();
        await this.openDialog();
        this.router.navigate(['/']);
      } catch (error) {
        console.error('Password update failed:', error);
      }
    } else {
      console.warn('Form invalid or passwords do not match');
    }
  }

  async updatePassword() {
    this.path = this.BASE_URL + '/users/' + this.userId;
    const firestoreData = {
      fields: {
        password: { stringValue: this.contactData.password },
      },
    };
    const response = await fetch(
      `${this.path}?updateMask.fieldPaths=password`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(firestoreData),
      }
    );
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  }
}
