import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { MatDialogModule } from '@angular/material/dialog';

@Component({
  selector: 'app-create-user',
  standalone: true,
  imports: [MatDialogModule, CommonModule],
  templateUrl: './create-user.component.html',
  styleUrl: './create-user.component.scss',
})
export class CreateUserComponent {
  @Input() overlayText: string = '';
  @Input() imageUrl: string = '';
}
