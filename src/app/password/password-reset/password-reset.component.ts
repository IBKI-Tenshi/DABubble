import { CommonModule } from '@angular/common';
import { Component, OnInit, Input } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { RouterModule, Router } from '@angular/router';
import { UserDataService } from '../../services/user_data.service';
import { UrlService } from '../../services/url.service';
import { CreateUserComponent } from '../../overlay/create-user.component';

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
export class PasswordResetComponent implements OnInit {
  @Input() disabled = false;

  contactData = {
    password: '',
    passwordMatch: '',
  };

  isConfirmed = false;
  isDuplicate = false;
  showOverlay = false;
  isLoading = false;
  errorMessage = '';

  private userId = '';
  private confirmTimer: any;

  constructor(
    private router: Router,
    private userDataService: UserDataService,
    private urlService: UrlService
  ) {}

  ngOnInit(): void {
    this.userId = this.userDataService.getUserId();
  }

  passwordsMatch(): boolean {
    return this.contactData.password === this.contactData.passwordMatch;
  }

  toggleConfirm(): void {
    this.isConfirmed = true;
    clearTimeout(this.confirmTimer);
    this.confirmTimer = setTimeout(() => {
      this.isConfirmed = false;
    }, 3000);
  }

  async showConfirmationOverlay(): Promise<void> {
    this.showOverlay = true;
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }

  async clearUserData(): Promise<void> {
    this.userId = '';
    await this.userDataService.deleteUserId();
  }

  async handleFormSubmit(ngForm: NgForm): Promise<void> {
    if (!ngForm.valid || !this.passwordsMatch()) {
      this.errorMessage = 'Passwords do not match or form is invalid.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    try {
      await this.updatePassword();
      await this.clearUserData();
      await this.showConfirmationOverlay();
      this.router.navigate(['/']);
    } catch (error) {
      console.error('Password update failed:', error);
      this.errorMessage = 'Failed to update password. Please try again.';
    } finally {
      this.isLoading = false;
    }
  }

  private async updatePassword(): Promise<any> {
    const url = `${this.urlService.BASE_URL}/users/${this.userId}?updateMask.fieldPaths=password`;
    const firestoreData = {
      fields: {
        password: { stringValue: this.contactData.password },
      },
    };

    const response = await fetch(url, {
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
