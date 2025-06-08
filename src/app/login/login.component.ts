import { Component, OnInit, NgZone } from '@angular/core';
import { Router } from '@angular/router';

import { LoginService } from '../services/login.service';

declare const google: any;

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent implements OnInit {
  constructor(
    private loginService: LoginService,
    private router: Router,
    private ngZone: NgZone
  ) {}

  doLogin() {
    this.loginService.login(); // Login setzen
    this.router.navigate(['/dashboard']); // Weiterleitung
  }

  ngOnInit(): void {
    google.accounts.id.initialize({
      client_id:
        '225459377281-mgau26838llh0qm3g7e33ckpd1m09sno.apps.googleusercontent.com',
      callback: this.handleCredentialResponse.bind(this),
    });

    google.accounts.id.renderButton(document.getElementById('googleBtn'), {
      theme: 'outline',
      size: 'large',
    });

    google.accounts.id.prompt();
  }

  handleCredentialResponse(response: any) {
    const token = response.credential;
    console.log('Received JWT:', token);

    localStorage.setItem('google_token', token);

    this.ngZone.run(() => {
      this.router.navigate(['/dashboard']);
    });
  }
}
