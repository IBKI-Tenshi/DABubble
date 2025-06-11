// import { Component, OnInit, NgZone, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
// import { Router } from '@angular/router';
// import { LoginService } from '../services/login.service';

// import { MatFormFieldModule } from '@angular/material/form-field';
// import { MatInputModule } from '@angular/material/input';
// import { MatIconModule } from '@angular/material/icon';
// import { ReactiveFormsModule } from '@angular/forms';

// import { FormControl, Validators } from '@angular/forms';
// import { NgIf } from '@angular/common';

// // Fehler unterdrücken
// const originalConsoleError = console.error;
// console.error = (...args) => {
//   if (args[0] && typeof args[0] === 'string' &&
//     (args[0].includes('Cross-Origin') || args[0].includes('window.postMessage'))) {
//     return;
//   }
//   originalConsoleError.apply(console, args);
// };

// declare const google: any;

// @Component({
//   selector: 'app-login',
//   standalone: true,
//   imports: [
//     MatInputModule,
//     MatIconModule,
//     ReactiveFormsModule,
//     MatFormFieldModule,
//     NgIf
//   ],
//   templateUrl: './login.component.html',
//   styleUrl: './login.component.scss',
// })
// export class LoginComponent implements OnInit, AfterViewInit {
//   @ViewChild('googleBtn') googleBtn!: ElementRef;

// emailControl = new FormControl('', [Validators.required, Validators.email]);
// passwordControl = new FormControl('', [Validators.required, Validators.minLength(6)]);
  
//   constructor(
//     private loginService: LoginService,
//     private router: Router,
//     private ngZone: NgZone
//   ) { }

//   doLogin() {
//     this.loginService.login();
//     this.router.navigate(['/dashboard']);
//   }

//   guestLogin() {
//     this.loginService.loginAsGuest();
//     this.router.navigate(['/dashboard']);
//   }


//   ngOnInit(): void {
//     console.log('LoginComponent initialisiert');
//     console.log('Exakter Origin für Google:', window.location.origin);
//   }

//   ngAfterViewInit(): void {
//     setTimeout(() => {
//       try {
//         if (this.googleBtn && this.googleBtn.nativeElement) {

//           // Diese Konfiguration ist optimiert, um Fehler zu minimieren
//           google.accounts.id.initialize({
//             client_id: '225459377281-mgau26838llh0qm3g7e33ckpd1m09sno.apps.googleusercontent.com',
//             callback: this.handleCredentialResponse.bind(this),
//             auto_select: false,
//             cancel_on_tap_outside: true,
//             use_fedcm_for_prompt: false
//           });

//           google.accounts.id.renderButton(this.googleBtn.nativeElement, {
//             theme: 'outline',
//             size: 'large',
//             text: 'signin_with',
//             shape: 'rectangular',
//             logo_alignment: 'left',
//             width: 240
//           });
//         } else {
//           console.error('Google Button Element nicht gefunden (ViewChild)!');
//         }
//       } catch (error) {
//         console.error('Fehler beim Initialisieren des Google-Logins:', error);
//       }
//     }, 300);
//   }

//   handleCredentialResponse(response: any) {
//     try {
//       if (!response || !response.credential) {
//         console.error('Ungültige Anmeldeantwort erhalten');
//         return;
//       }

//       const token = response.credential;
//       console.log('Google Login erfolgreich');

//       // Nach der Anmeldung manuell die Konsole leeren
//       setTimeout(() => console.clear(), 100);

//       localStorage.setItem('google_token', token);
//       this.loginService.login();

//       this.ngZone.run(() => {
//         setTimeout(() => {
//           this.router.navigate(['/dashboard']);
//         }, 50);
//       });
//     } catch (error) {
//       console.error('Fehler bei der Verarbeitung der Anmeldung:', error);
//     }
//   }
// }


import {
  Component,
  OnInit,
  NgZone,
  AfterViewInit
} from '@angular/core';
import { Router } from '@angular/router';
import { LoginService } from '../services/login.service';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { ReactiveFormsModule, FormControl, Validators } from '@angular/forms';
import { NgIf } from '@angular/common';

// Fehler unterdrücken
const originalConsoleError = console.error;
console.error = (...args) => {
  if (
    args[0] &&
    typeof args[0] === 'string' &&
    (args[0].includes('Cross-Origin') || args[0].includes('window.postMessage'))
  ) {
    return;
  }
  originalConsoleError.apply(console, args);
};

declare const google: any;

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    MatInputModule,
    MatIconModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    NgIf,
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent implements OnInit, AfterViewInit {
  emailControl = new FormControl('', [Validators.required, Validators.email]);
  passwordControl = new FormControl('', [Validators.required, Validators.minLength(6)]);

  constructor(
    private loginService: LoginService,
    private router: Router,
    private ngZone: NgZone
  ) {}

  ngOnInit(): void {
    console.log('LoginComponent initialisiert');
    console.log('Exakter Origin für Google:', window.location.origin);
  }

  ngAfterViewInit(): void {
    try {
      google.accounts.id.initialize({
        client_id: '225459377281-mgau26838llh0qm3g7e33ckpd1m09sno.apps.googleusercontent.com',
        callback: this.handleCredentialResponse.bind(this),
        auto_select: false,
        cancel_on_tap_outside: true,
        use_fedcm_for_prompt: false,
      });
    } catch (error) {
      console.error('Fehler beim Initialisieren des Google-Logins:', error);
    }
  }

  triggerGoogleLogin() {
    google.accounts.id.prompt(); // manuelles Triggern
  }

  handleCredentialResponse(response: any) {
    try {
      if (!response || !response.credential) {
        console.error('Ungültige Anmeldeantwort erhalten');
        return;
      }

      const token = response.credential;
      console.log('Google Login erfolgreich');

      setTimeout(() => console.clear(), 100);

      localStorage.setItem('google_token', token);
      this.loginService.login();

      this.ngZone.run(() => {
        setTimeout(() => {
          this.router.navigate(['/dashboard']);
        }, 50);
      });
    } catch (error) {
      console.error('Fehler bei der Verarbeitung der Anmeldung:', error);
    }
  }

  doLogin() {
    this.loginService.login();
    this.router.navigate(['/dashboard']);
  }

  guestLogin() {
    this.loginService.loginAsGuest();
    this.router.navigate(['/dashboard']);
  }
}
