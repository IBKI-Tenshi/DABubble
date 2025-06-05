import { Component } from '@angular/core';
import { Router } from '@angular/router';

import { LoginService } from '../services/login.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {



    constructor(private loginService: LoginService, private router: Router) {}

  doLogin() {
    this.loginService.login();             // Login setzen
    this.router.navigate(['/dashboard']);  // Weiterleitung
  }
}
