import {
  Component,
  ElementRef,
  OnInit,
  ViewChild,
  inject,
} from '@angular/core';
import { Auth } from '@angular/fire/auth'; // used for authentication
import { LoginService } from '../services/login.service';
import {
  FormControl,
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
import { Router, RouterModule } from '@angular/router';
import { GoogleAuth } from '../services/google.service';

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
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  private auth = inject(Auth); // used for authentication
  isLoggingIn = false;
  loginErrorMail: string | null = null;
  loginErrorPassword: string | null = null;

  @ViewChild('googleButton', { static: true }) googleButton!: ElementRef;

  constructor(
    private loginService: LoginService,
    private snackBar: MatSnackBar,
    private googleLogin: GoogleAuth,
    private router: Router,
    private fb: FormBuilder
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]],
    });
  }

  ngOnInit(): void {
    this.setupGoogleLogin();
    this.setupAnimations();
    this.checkLoginStatus();
  }

  loginWithGoogle() {
    this.loginService
      .loginWithGoogle()
      .catch((err) =>
        this.snackBar.open('Fehler beim Google-Login', 'OK', { duration: 3000 })
      );
  }

  private setupGoogleLogin(): void {
    this.googleLogin.initializeGoogleAuth(
      this.handleCredentialResponse.bind(this)
    );

    google.accounts.id.renderButton(this.googleButton.nativeElement, {
      type: 'standard',
      theme: 'outline',
      size: 'large',
      width: 300,
    });
  }

  private setupAnimations(): void {
    const hasAnimated = sessionStorage.getItem('animation');
    if (!hasAnimated) {
      this.runStartupAnimation();
      sessionStorage.setItem('animation', 'true');
    }
  }

  private checkLoginStatus(): void {
    const tokenInStorage =
      localStorage.getItem('slack_clone_user_token') !== null ||
      localStorage.getItem('slack_clone_google_token') !== null ||
      localStorage.getItem('slack_clone_guest_token') !== null;

    const isLoggedInStatus = this.loginService.isLoggedIn();

    if (!tokenInStorage && !isLoggedInStatus) {
      this.loginService.logout();
    }
  }

  private handleCredentialResponse(
    response: google.accounts.id.CredentialResponse
  ): void {
    const payload = JSON.parse(atob(response.credential.split('.')[1]));
    this.loginService.googleLoginWithCredential(response.credential, payload);
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
        this.navigateAfterLogin();
        console.log('Logged in!', result.uid);
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

  /*
  async doLogin(): Promise<void> {
    this.resetLoginError();

    if (this.isLoggingIn) {
      return;
    }

    this.emailControl.markAsTouched();
    this.passwordControl.markAsTouched();

    const email = this.emailControl.value || '';
    const password = this.passwordControl.value || '';

    if (this.emailControl.invalid || this.passwordControl.invalid) {
      return;
    }

    this.isLoggingIn = true;

    try {
      const result = await this.loginService.logIn(email, password);

      if (!result.success) {
        switch (result.reason) {
          case 'missing-credentials':
            this.showError('Bitte gib E-Mail und Passwort ein.');
            break;
          case 'auth/wrong-password':
            this.passwordControl.markAsTouched();
            this.passwordControl.setErrors({ wrong: true });
            break;
          default:
            this.passwordControl.markAsTouched();
            this.passwordControl.setErrors({ invalid: true });
            this.emailControl.markAsTouched();
            this.emailControl.setErrors({ invalid: true });
        }
        return;
      }

      this.navigateAfterLogin();
    } catch (error) {
      this.showError('Login fehlgeschlagen');
    }

    this.isLoggingIn = false;
  }
*/

  async guestLogin(): Promise<void> {
    if (this.isLoggingIn) return;
    this.isLoggingIn = true;

    try {
      const user = await this.loginService.signInAsGuest();

      if (user && user.uid) {
        await new Promise((resolve) => setTimeout(resolve, 100));
        this.navigateAfterLogin();
      } else {
        this.showError('Gast-Login fehlgeschlagen');
      }
    } catch (error) {
      this.showError('Gast-Login fehlgeschlagen');
    } finally {
      this.isLoggingIn = false;
    }
  }

  private navigateAfterLogin(): void {
    setTimeout(() => {
      if (this.loginService.isLoggedIn()) {
        this.router.navigate(['/directMessage/general']);
      }
    }, 100);
  }

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
