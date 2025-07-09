import { CommonModule } from '@angular/common';
import { Component, inject, Input } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { RouterModule, Router } from '@angular/router';
import { UserIdService } from '../../services/userId.service';
import { AuthService } from '../../services/register.service';
import {
  doc,
  setDoc,
  Firestore,
  serverTimestamp,
} from '@angular/fire/firestore';

@Component({
  selector: 'app-user-account',
  standalone: true,
  imports: [MatButtonModule, FormsModule, CommonModule, RouterModule],
  templateUrl: './user-account.component.html',
  styleUrl: './user-account.component.scss',
})
export class UserAccountComponent {
  contactData = {
    name: '',
    email: '',
    password: '',
    privacyAccepted: false,
  };

  isDuplicate = false;
  @Input() disabled: boolean = false;

  constructor(
    private router: Router,
    private userDataService: UserIdService,
    private authService: AuthService,
    private firestore: Firestore
  ) {}

  async createUser(form: any) {
    await this.onSubmit(form);
    await this.showAndNavigate();
  }

  async onSubmit(form: any) {
    this.isDuplicate = false;
    const { email, password, name, privacyAccepted } = this.contactData;

    try {
      const userCredential = await this.authService.register(
        email,
        password,
        name,
        privacyAccepted
      );
      const user = userCredential.user;
      console.log('User created:', user);

      const userDocRef = doc(this.firestore, 'users', user.uid);
      await setDoc(userDocRef, {
        email: user.email,
        name: name,
        privacyAccepted: privacyAccepted,
        createdAt: serverTimestamp(),
      });

      this.userDataService.setUserId(user.uid);
      this.userDataService.setUserName(name);
    } catch (error: any) {
      console.error('Registration error:', error);
      if (error.code === 'auth/email-already-in-use') {
        this.isDuplicate = true;
      }
    }
  }

  onEmailInput() {
    this.isDuplicate = false;
  }

  async showAndNavigate(): Promise<void> {
    this.router.navigate(['/avatarSelection']);
  }
}
