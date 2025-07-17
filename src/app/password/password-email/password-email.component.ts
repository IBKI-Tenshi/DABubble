import { CommonModule } from '@angular/common';
import { Component, Input, inject } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { RouterModule, Router } from '@angular/router';
import { UserDataService } from '../../services/user_data.service';
import { UrlService } from '../../services/url.service';
import { CreateUserComponent } from '../../overlay/create-user.component';
import { sendPasswordResetEmail } from 'firebase/auth';
import { Auth } from '@angular/fire/auth';

@Component({
  selector: 'app-password-email',
  standalone: true,
  imports: [
    MatButtonModule,
    FormsModule,
    CommonModule,
    RouterModule,
    CreateUserComponent,
  ],
  templateUrl: './password-email.component.html',
  styleUrls: ['./password-email.component.scss'],
})
export class PasswordEmailComponent {
  private auth: Auth;
  @Input() disabled: boolean = false;
  showOverlay: boolean = false;

  contactData = {
    email: '',
  };

  isConfirmed = false;
  emailExists = true;
  BASE_URL: string;

  constructor(
    private router: Router,
    private urlService: UrlService,
    private userDataService: UserDataService
  ) {
    this.BASE_URL = this.urlService.BASE_URL;
    this.auth = inject(Auth);
  }

  toggleConfirm(): void {
    this.isConfirmed = true;
    setTimeout(() => {
      this.isConfirmed = false;
    }, 3000);
  }

  onEmailInput(): void {
    this.emailExists = true;
  }

  async openDialog(): Promise<void> {
    this.showOverlay = true;
    await this.delay(2000);
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async onSubmit(ngForm: NgForm): Promise<void> {
    if (!this.isFormValid(ngForm)) return;

    const userId = await this.handleEmailCheck(this.contactData.email);
    if (userId) {
      this.preparePasswordResetFlow(userId);
    } else {
      this.emailExists = false;
    }
  }

  isFormValid(form: NgForm): boolean {
    return form.submitted && form.form.valid;
  }

  async handleEmailCheck(email: string): Promise<string | null> {
    try {
      const results = await this.queryEmail(email);
      return this.extractUserIdFromResults(results);
    } catch (error) {
      console.error('Email check failed:', error);
      return null;
    }
  }

  async queryEmail(email: string): Promise<any[]> {
    const queryPayload = this.buildEmailQuery(email);
    const response = await fetch(`${this.BASE_URL}:runQuery`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(queryPayload),
    });

    if (!response.ok) {
      throw new Error(`Error checking email: ${response.status}`);
    }

    return await response.json();
  }

  buildEmailQuery(email: string): object {
    return {
      structuredQuery: {
        from: [{ collectionId: 'users' }],
        where: {
          fieldFilter: {
            field: { fieldPath: 'email' },
            op: 'EQUAL',
            value: { stringValue: email },
          },
        },
      },
    };
  }

  extractUserIdFromResults(results: any[]): string | null {
    for (const doc of results) {
      if (doc.document?.name) {
        const parts = doc.document.name.split('/');
        return parts[parts.length - 1];
      }
    }
    return null;
  }

  async preparePasswordResetFlow(userId: string): Promise<void> {
    this.emailExists = true;
    this.userDataService.setUserId(userId);

    // 🔥 Send reset email here
    try {
      await sendPasswordResetEmail(this.auth, this.contactData.email);
      this.toggleConfirm();
      await this.openDialog();
      this.router.navigate(['/passwordReset']);
    } catch (error) {
      console.error('Error sending reset email:', error);
    }
  }
}
