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

  toggleConfirm(): void {
    this.isConfirmed = true;
    setTimeout(() => {
      this.isConfirmed = false;
    }, 3000);
  }

  onEmailInput(): void {
    this.isDuplicate = false;
  }

  async onSubmit(ngForm: NgForm): Promise<void> {
    if (!this.isFormValid(ngForm)) return;

    const emailExists = await this.handleEmailCheck();
    if (emailExists) return;

    await this.registerUser();
    this.router.navigate(['/avatarSelection']);
  }

  isFormValid(form: NgForm): boolean {
    return form.submitted && form.form.valid;
  }

  async handleEmailCheck(): Promise<boolean> {
    const exists = await this.checkEmailExists(this.contactData.email);
    this.isDuplicate = exists;
    return exists;
  }

  async registerUser(): Promise<void> {
    const userId = await this.createUser('/users', this.contactData);
    this.userDataService.setUserId(userId);
    this.userDataService.setName(this.contactData.name);
    this.toggleConfirm();
  }

  async createUser<T = any>(
    path: string = '',
    data: Record<string, any> = {}
  ): Promise<string> {
    const firestoreData = this.buildUserPayload(data);
    const response = await fetch(`${this.BASE_URL}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(firestoreData),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return this.extractDocumentId(await response.json());
  }

  buildUserPayload(data: Record<string, any>): object {
    return {
      fields: {
        name: { stringValue: this.contactData.name },
        email: { stringValue: this.contactData.email },
        password: { stringValue: this.contactData.password },
        privacyAccepted: { booleanValue: this.contactData.privacyAccepted },
      },
    };
  }

  extractDocumentId(responseJson: any): string {
    const fullPath = responseJson.name;
    return fullPath.split('/').pop();
  }

  async checkEmailExists(email: string): Promise<boolean> {
    const queryBody = this.buildEmailQuery(email);
    const response = await fetch(`${this.BASE_URL}:runQuery`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(queryBody),
    });

    if (!response.ok) {
      throw new Error(`Error checking email: ${response.status}`);
    }

    const results = await response.json();
    return results.some((doc: any) => doc.document);
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
}
