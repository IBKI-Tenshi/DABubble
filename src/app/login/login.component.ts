import {
  Component,
  ElementRef,
  OnInit,
  AfterViewInit,
  ViewChild,
  inject,
} from '@angular/core';
import { Auth } from '@angular/fire/auth';
import { LoginService } from '../services/login.service';
import {
  Validators,
  ReactiveFormsModule,
  FormGroup,
  FormBuilder,
} from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { GoogleAuth } from '../services/google.service';

// TS hint for the global loaded by Google Identity script
declare const google: any;

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    MatInputModule,
    MatIconModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSnackBarModule,
    CommonModule,
    RouterModule,
  ],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent implements OnInit, AfterViewInit {
  loginForm: FormGroup;
  private auth = inject(Auth);
  isLoggingIn = false;
  loginErrorMail: string | null = null;
  loginErrorPassword: string | null = null;

  // Ensure the template contains an element like: <div #googleButton></div>
  @ViewChild('googleButton', { static: false }) googleButton!: ElementRef;

  constructor(
    private loginService: LoginService,
    private snackBar: MatSnackBar,
    private googleLogin: GoogleAuth,
    private fb: FormBuilder
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]],
    });
  }

  ngOnInit(): void {
    // Initialize Google auth (registers the callback, loads script, etc.)
    this.googleLogin.initializeGoogleAuth(
      this.handleCredentialResponse.bind(this)
    );

    this.setupAnimations();
    this.checkLoginStatus(); // pure check; no side-effects
  }

  ngAfterViewInit(): void {
    // Render the Google button once the view exists and the script is ready
    this.tryRenderGoogleButton();
  }

  // --- Google ---------------------------------------------------------------

  loginWithGoogle() {
    this.loginService
      .loginWithGoogle()
      .catch(() =>
        this.snackBar.open('Fehler beim Google-Login', 'OK', { duration: 3000 })
      );
  }

  private tryRenderGoogleButton(): void {
    const render = () => {
      try {
        google.accounts.id.renderButton(this.googleButton.nativeElement, {
          type: 'standard',
          theme: 'outline',
          size: 'large',
          width: 300,
        });
      } catch {
        this.snackBar.open(
          'Google Login konnte nicht initialisiert werden.',
          'OK',
          { duration: 3000 }
        );
      }
    };

    // If the script is ready, render immediately
    const g = (window as any).google;
    if (g?.accounts?.id?.renderButton && this.googleButton?.nativeElement) {
      render();
      return;
    }

    // Otherwise, poll briefly for readiness
    let tries = 0;
    const maxTries = 50;
    const iv = setInterval(() => {
      const gg = (window as any).google;
      if (gg?.accounts?.id?.renderButton && this.googleButton?.nativeElement) {
        clearInterval(iv);
        render();
      } else if (++tries >= maxTries) {
        clearInterval(iv);
        // Optional: inform user that Google button could not be shown
        // (The regular email/password and guest flows still work.)
      }
    }, 100);
  }

  private handleCredentialResponse(
    response: google.accounts.id.CredentialResponse
  ): void {
    try {
      const payload = JSON.parse(atob(response.credential.split('.')[1]));
      // Service handles token save, profile load, and navigation
      this.loginService.googleLoginWithCredential(response.credential, payload);
    } catch {
      this.snackBar.open('Ungültige Google-Antwort.', 'OK', { duration: 3000 });
    }
  }

  // --- UI helpers -----------------------------------------------------------

  private setupAnimations(): void {
    const hasAnimated = sessionStorage.getItem('animation');
    if (!hasAnimated) {
      this.runStartupAnimation();
      sessionStorage.setItem('animation', 'true');
    }
  }

  private runStartupAnimation(): void {
    const width = window.innerWidth;
    if (width <= 600) {
      sessionStorage.setItem('animationType', 'mobileScreen');
    } else if (width <= 900) {
      sessionStorage.setItem('animationType', 'smallScreen');
    } else if (width <= 1550) {
      sessionStorage.setItem('animationType', 'middleScreen');
    } else {
      sessionStorage.setItem('animationType', 'fullScreen');
    }
  }

  private checkLoginStatus(): void {
    // Pure read; do not call logout() here
    const hasToken =
      !!localStorage.getItem('slack_clone_user_token') ||
      !!localStorage.getItem('slack_clone_google_token') ||
      !!localStorage.getItem('slack_clone_guest_token');

    const isLoggedIn = this.loginService.isLoggedInSync();
    // Intentionally no side effects; route guards decide access
    // (You could show UI changes based on hasToken/isLoggedIn if needed)
  }

  // --- Email/password login -------------------------------------------------

  async onLoginClick() {
    if (this.isLoggingIn) return;
    this.isLoggingIn = true;

    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      this.isLoggingIn = false;
      return;
    }

    const { email, password } = this.loginForm.value;

    try {
      const result = await this.loginService.logIn(email, password);
      if (result.success) {
        console.log('Logged in!', result.uid);
        // Navigation handled by the service
      } else {
        this.handleLoginError(result.reason);
      }
    } catch (err) {
      console.error('Unexpected error during login:', err);
      this.showError('An unexpected error occurred');
    } finally {
      this.isLoggingIn = false;
    }
  }

  // --- Guest login ----------------------------------------------------------

  async guestLogin(): Promise<void> {
    if (this.isLoggingIn) return;
    this.isLoggingIn = true;

    try {
      const user = await this.loginService.signInAsGuest();
      if (!user?.uid) {
        this.showError('Gast-Login fehlgeschlagen');
      }
      // Navigation handled by the service
    } catch (error) {
      this.showError('Gast-Login fehlgeschlagen');
    } finally {
      this.isLoggingIn = false;
    }
  }

  // --- Errors ---------------------------------------------------------------

  private resetLoginError(): void {
    this.loginErrorMail = null;
    this.loginErrorPassword = null;
  }

  private handleLoginError(reason?: string): void {
    switch (reason) {
      case 'missing-credentials':
        this.showError('Bitte gib E-Mail und Passwort ein.');
        break;
      case 'auth/wrong-password':
        this.loginForm.get('password')?.setErrors({ wrong: true });
        break;
      default:
        this.loginForm.get('email')?.setErrors({ invalid: true });
        this.loginForm.get('password')?.setErrors({ invalid: true });
        this.showError('Login fehlgeschlagen');
    }
  }

  private showError(message: string): void {
    this.snackBar.open(message, 'OK', {
      duration: 3000,
      panelClass: 'error-snackbar',
    });
  }
}
