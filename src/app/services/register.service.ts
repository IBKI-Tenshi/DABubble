import { Injectable, inject } from '@angular/core';
import { Auth, createUserWithEmailAndPassword } from '@angular/fire/auth';
import { Firestore } from '@angular/fire/firestore';

@Injectable({ providedIn: 'root' })
export class AuthService {
  constructor(private auth: Auth) {}
  private firestore = inject(Firestore);

  register(
    email: string,
    password: string,
    name: string,
    privacyAccepted: boolean
  ) {
    return createUserWithEmailAndPassword(this.auth, email, password);
  }
}
