import { Component, OnInit } from '@angular/core';
import { LoginService } from '../services/login.service';
import { FormControl, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

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
    RouterModule
  ],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent implements OnInit {
  // Form controls
  emailControl = new FormControl('', [Validators.required, Validators.email]);
  passwordControl = new FormControl('', [Validators.required, Validators.minLength(6)]);
  
  // Status variables
  isLoggingIn = false;
  loginErrorMail: string | null = null;
  loginErrorPassword: string | null = null;
  
  constructor(
    private loginService: LoginService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    // Animation Session Storage Check
    const hasAnimated = sessionStorage.getItem('animation');
    if (!hasAnimated) {
      this.runStartupAnimation();
      sessionStorage.setItem('animation', 'true');
    }
    
    // WICHTIG: Prüfen, ob bereits angemeldet
    const tokenInStorage = localStorage.getItem('slack_clone_user_token') !== null || 
                          localStorage.getItem('slack_clone_google_token') !== null || 
                          localStorage.getItem('slack_clone_guest_token') !== null;
    
    const isLoggedInStatus = this.loginService.isLoggedIn();
    
    console.log('📊 Login-Komponente initialisiert mit:', {
      tokenInStorage,
      isLoggedInStatus
    });
    
    // Logout NUR wenn KEINE Tokens vorhanden und der Status false ist
    if (!tokenInStorage && !isLoggedInStatus) {
      console.log('🔄 Keine Tokens und nicht angemeldet, führe Logout durch');
      this.loginService.logout();
    } else {
      console.log('🔒 Token oder Login-Status gefunden, kein Logout notwendig');
    }
  }

  /**
   * Startup Animation basierend auf der Fensterbreite
   */
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

  async doLogin(): Promise<void> {
    console.log('🔍 LOGIN BUTTON CLICKED');
    console.log('📧 Email:', this.emailControl.value);
    console.log('🔒 Password length:', this.passwordControl.value?.length);
    console.log('✅ Email valid:', this.emailControl.valid);
    console.log('✅ Password valid:', this.passwordControl.valid);
    
    this.resetLoginError();
    
    if (this.isLoggingIn) {
      console.log('⚠️ Already logging in, return');
      return;
    }
    
    this.emailControl.markAsTouched();
    this.passwordControl.markAsTouched();
    
    const email = this.emailControl.value || '';
    const password = this.passwordControl.value || '';
    
    if (this.emailControl.invalid || this.passwordControl.invalid) {
      console.log('❌ Form invalid, stopping');
      return;
    }
    
    console.log('🚀 Calling LoginService...');
    this.isLoggingIn = true;
    
    try {
      const result = await this.loginService.logIn(email, password);
      console.log('📤 LoginService result:', result);
      
      // WICHTIG: Fügen Sie hier eine Verzögerung ein
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Navigieren Sie zur Hauptseite nach erfolgreichem Login
      if (result && result.uid) {
        this.navigateAfterLogin();
      }
    } catch (error) {
      console.log('💥 LoginService error:', error);
      this.showError('Login fehlgeschlagen');
    }
    
    this.isLoggingIn = false;
  }

  /**
   * Google Login (vereinfacht mit Test-Login)
   */
  async triggerGoogleLogin(): Promise<void> {
    if (this.isLoggingIn) return;
    this.isLoggingIn = true;
    
    try {
      const result = await this.loginService.googleSignIn();
      
      if (result && result.user && result.user.uid) {
        console.log('✅ Google-Login erfolgreich:', result);
        
        // WICHTIG: Warten, damit localStorage-Updates wirksam werden
        await new Promise(resolve => setTimeout(resolve, 100));
        
        this.navigateAfterLogin();
      } else {
        this.showError('Google-Anmeldung fehlgeschlagen');
      }
    } catch (error) {
      this.showError('Google-Anmeldung fehlgeschlagen');
    } finally {
      this.isLoggingIn = false;
    }
  }

  /**
   * Gast-Login
   */
  async guestLogin(): Promise<void> {
    if (this.isLoggingIn) return;
    this.isLoggingIn = true;
    
    try {
      const user = await this.loginService.signInAsGuest();
      
      if (user && user.uid) {
        console.log('✅ Gast-Login erfolgreich');
        
        // WICHTIG: Warten, damit localStorage-Updates wirksam werden
        await new Promise(resolve => setTimeout(resolve, 100));
        
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

  private navigateAfterLogin() {
    console.log('=== NAVIGATION NACH LOGIN ===');
    
    // WICHTIG: Gib dem System etwas Zeit, den Status zu aktualisieren
    setTimeout(() => {
      const isLoggedIn = this.loginService.isLoggedIn();
      console.log('Login-Status:', isLoggedIn);
    }, 100);
  }

  /**
   * Fehler zurücksetzen
   */
  private resetLoginError(): void {
    this.loginErrorMail = null;
    this.loginErrorPassword = null;
  }

  /**
   * Zeigt eine Fehlermeldung an
   */
  private showError(message: string): void {
    this.snackBar.open(message, 'OK', {
      duration: 3000,
      panelClass: 'error-snackbar'
    });
  }
}