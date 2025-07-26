import { CommonModule } from '@angular/common';
import { Component, Input, OnInit, inject } from '@angular/core';
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
    CommonModule,
    FormsModule,
    MatButtonModule,
    RouterModule,
    CreateUserComponent,
  ],
  templateUrl: './password-email.component.html',
  styleUrls: ['./password-email.component.scss'],
})
export class PasswordEmailComponent implements OnInit {
  @Input() disabled = false;

  contactData = {
    email: '',
  };

  showOverlay = false;
  isConfirmed = false;
  emailExists = true;
  isLoading = false;
  errorMessage = '';

  private auth: Auth = inject(Auth);
  private BASE_URL: string = this.urlService.BASE_URL;

  constructor(
    private router: Router,
    private urlService: UrlService,
    private userDataService: UserDataService
  ) {}

  ngOnInit(): void {
    // Initialization logic if needed in future
  }

  onEmailInput(): void {
    this.emailExists = true;
    this.errorMessage = '';
  }

  async onSubmit(form: NgForm): Promise<void> {
    if (!this.isFormValid(form)) {
      this.errorMessage = 'Bitte geben Sie eine gültige E-Mail-Adresse ein.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    try {
      const userId = await this.handleEmailCheck(this.contactData.email);
      if (userId) {
        await this.preparePasswordResetFlow(userId);
      } else {
        this.emailExists = false;
        this.errorMessage = 'Diese E-Mail ist nicht registriert.';
      }
    } catch (error) {
      console.error('Error in password reset flow:', error);
      this.errorMessage =
        'Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.';
    } finally {
      this.isLoading = false;
    }
  }

  private isFormValid(form: NgForm): boolean {
    return form.submitted && Boolean(form.valid);
  }

  private async handleEmailCheck(email: string): Promise<string | null> {
    try {
      const results = await this.queryEmail(email);
      return this.extractUserIdFromResults(results);
    } catch (error) {
      console.error('Email check failed:', error);
      throw error;
    }
  }

  private async queryEmail(email: string): Promise<any[]> {
    const queryPayload = this.buildEmailQuery(email);
    const response = await fetch(`${this.BASE_URL}:runQuery`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(queryPayload),
    });

    if (!response.ok) {
      throw new Error(`Fehler beim Abfragen der E-Mail: ${response.status}`);
    }

    return await response.json();
  }

  private buildEmailQuery(email: string): object {
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

  private extractUserIdFromResults(results: any[]): string | null {
    for (const doc of results) {
      if (doc.document?.name) {
        const parts = doc.document.name.split('/');
        return parts.at(-1) ?? null;
      }
    }
    return null;
  }

  private async preparePasswordResetFlow(userId: string): Promise<void> {
    this.userDataService.setUserId(userId);

    try {
      await sendPasswordResetEmail(this.auth, this.contactData.email);
      this.toggleConfirm();
      await this.showConfirmationOverlay();
      this.router.navigate(['/passwordReset']);
    } catch (error) {
      console.error('Fehler beim Senden der E-Mail:', error);
      throw error;
    }
  }

  private toggleConfirm(): void {
    this.isConfirmed = true;
    setTimeout(() => {
      this.isConfirmed = false;
    }, 3000);
  }

  private async showConfirmationOverlay(): Promise<void> {
    this.showOverlay = true;
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }
}
