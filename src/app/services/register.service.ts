import { Injectable, inject } from '@angular/core';
import {
  Auth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from '@angular/fire/auth';
import { Firestore, doc, getDoc } from '@angular/fire/firestore';

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
