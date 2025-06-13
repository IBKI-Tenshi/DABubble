import { CommonModule } from '@angular/common';
import { Component, inject, Input } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { RouterModule, Router } from '@angular/router';
import { UserDataService } from '../../services/user_data.service';
import { UrlService } from '../../services/url.service';

@Component({
  selector: 'app-user-account',
  standalone: true,
  imports: [MatButtonModule, FormsModule, CommonModule, RouterModule],
  templateUrl: './user-account.component.html',
  styleUrl: './user-account.component.scss',
})
export class UserAccountComponent {
  @Input() disabled: boolean = false;

  constructor(
    private router: Router,
    private userDataService: UserDataService,
    private urlService: UrlService
  ) {}

  contactData = {
    name: '',
    email: '',
    password: '',
    privacyAccepted: false,
  };

  isConfirmed = false;

  isDuplicate = false;

  BASE_URL = this.urlService.BASE_URL;

  toggleConfirm() {
    this.isConfirmed = true;
    setTimeout(() => {
      this.isConfirmed = false;
    }, 3000);
  }

  onEmailInput() {
    this.isDuplicate = false;
  }

  async onSubmit(ngForm: NgForm) {
    if (ngForm.submitted && ngForm.form.valid) {
      const exists = await this.checkEmailExists(this.contactData.email);
      if (exists) {
        this.isDuplicate = true;
        return;
      } else {
        this.isDuplicate = false;
        const userId = await this.createUser('/users', this.contactData);
        this.userDataService.setUserId(userId);
        this.userDataService.setName(this.contactData.name);
        this.toggleConfirm();
        this.router.navigate(['/avatarSelection']);
      }
    }
  }

  async createUser<T = any>(
    path: string = '',
    data: Record<string, any> = {}
  ): Promise<T> {
    const firestoreData = {
      fields: {
        name: { stringValue: this.contactData.name },
        email: { stringValue: this.contactData.email },
        password: { stringValue: this.contactData.password },
        privacyAccepted: { booleanValue: this.contactData.privacyAccepted },
      },
    };
    const response = await fetch(`${this.BASE_URL}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(firestoreData),
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const result = await response.json();
    const fullPath = result.name;
    const docId = fullPath.split('/').pop();
    return docId;
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
