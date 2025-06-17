import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { RouterModule, Router } from '@angular/router';
import { UserDataService } from '../../services/user_data.service';
import { UrlService } from '../../services/url.service';

@Component({
  selector: 'app-password-email',
  standalone: true,
  imports: [MatButtonModule, FormsModule, CommonModule, RouterModule],
  templateUrl: './password-email.component.html',
  styleUrls: ['./password-email.component.scss'], // changed from styleUrl to styleUrls
})
export class PasswordEmailComponent {
  @Input() disabled: boolean = false;

  contactData = {
    name: '',
    email: '',
    password: '',
    privacyAccepted: false,
  };

  isConfirmed = false;
  emailExists = true;
  BASE_URL: string;

  constructor(private router: Router, private urlService: UrlService) {
    this.BASE_URL = this.urlService.BASE_URL;
  }

  toggleConfirm() {
    this.isConfirmed = true;
    setTimeout(() => {
      this.isConfirmed = false;
    }, 3000);
  }

  onEmailInput() {
    this.emailExists = true;
  }

  async onSubmit(ngForm: NgForm) {
    if (ngForm.submitted && ngForm.form.valid) {
      const exists = await this.checkEmailExists(this.contactData.email);
      if (!exists) {
        this.emailExists = false;
        return;
      } else {
        this.emailExists = true;
        this.toggleConfirm();
      }
    }
  }

  async checkEmailExists(email: string): Promise<boolean> {
    const response = await fetch(`${this.BASE_URL}:runQuery`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
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
      }),
    });
    if (!response.ok) {
      throw new Error(`Error checking email: ${response.status}`);
    }
    const results = await response.json();
    return results.some((doc: any) => doc.document);
  }
}
