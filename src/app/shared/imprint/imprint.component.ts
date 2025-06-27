import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Location } from '@angular/common';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-impressum',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './imprint.component.html',
  styleUrls: ['./imprint.component.scss']
})
export class ImprintComponent {
  title = 'Impressum';

  constructor(private location: Location, private router: Router) {}

  goBack(): void {
    if (document.referrer.includes('login') || document.referrer === '') {
      this.router.navigate(['']);
    } else {
      this.location.back();
    }
  }
}