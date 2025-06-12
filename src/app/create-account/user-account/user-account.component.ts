import { CommonModule } from '@angular/common';
import { Component, inject, Input } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { RouterModule } from '@angular/router';

const BASE_URL =
  'https://firestore.googleapis.com/v1/projects/dabubble-7e942/databases/(default)/documents';

@Component({
  selector: 'app-user-account',
  standalone: true,
  imports: [MatButtonModule, FormsModule, CommonModule, RouterModule],
  templateUrl: './user-account.component.html',
  styleUrl: './user-account.component.scss',
})
export class UserAccountComponent {
  @Input() disabled: boolean = false;

  contactData = {
    name: '',
    email: '',
    password: '',
    privacyAccepted: false,
  };

  isConfirmed = false;

  isDuplicate = false;

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
        this.createUser('/users', this.contactData);
        this.toggleConfirm();
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
    const response = await fetch(`${BASE_URL}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(firestoreData),
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  }

  async checkEmailExists(email: string): Promise<boolean> {
    const response = await fetch(`${BASE_URL}:runQuery`, {
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
