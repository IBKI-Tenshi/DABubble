import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Location } from '@angular/common';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-privacy',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './privacy.component.html',
  styleUrls: ['./privacy.component.scss']
})
export class PrivacyComponent {
  title = 'Datenschutz';

  constructor(private location: Location, private router: Router) {}

  goBack(): void {
    if (document.referrer.includes('login') || document.referrer === '') {
      this.router.navigate(['']);
    } else {
      this.location.back();
    }
  }
}