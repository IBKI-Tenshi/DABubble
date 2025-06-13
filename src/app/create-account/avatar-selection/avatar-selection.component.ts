import { Component } from '@angular/core';
import { RouterModule, Router } from '@angular/router';

@Component({
  selector: 'app-avatar-selection',
  standalone: true,
  imports: [RouterModule],
  templateUrl: './avatar-selection.component.html',
  styleUrl: './avatar-selection.component.scss',
})
export class AvatarSelectionComponent {
  constructor(private router: Router) {}

  successMove() {
    this.router.navigate(['/']);
  }
}
