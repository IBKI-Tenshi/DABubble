
import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

import { MatDialogModule } from '@angular/material/dialog';   // benötigt für dialog
import { MatDialog } from '@angular/material/dialog';   // benötigt für dialog
import { DialogAddUserComponent } from '../dialog-add-user/dialog-add-user.component';
import { MatCardModule } from '@angular/material/card';

import { User } from '../../models/user.class';
import { NgFor } from '@angular/common';

import { Firestore, collection, onSnapshot, CollectionReference } from '@angular/fire/firestore';
import { RouterModule } from '@angular/router';   // benötigt für [routertlink]

@Component({
  selector: 'app-user',
  standalone: true,
  imports: [
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatDialogModule,
    MatCardModule,
    NgFor,
    RouterModule
  ],
  templateUrl: './user.component.html',
  styleUrl: './user.component.scss'
})
export class UserComponent {

  user = new User();
  allUsers: User[] = [];

  constructor(private firestore: Firestore, public dialog: MatDialog) { }

  openDialog() {
    (document.activeElement as HTMLElement)?.blur();  // Fokus vom aktuellen Element nehmen
    this.dialog.open(DialogAddUserComponent);
  }

  ngOnInit(): void {
    const usersRef: CollectionReference = collection(this.firestore, 'users');

    onSnapshot(usersRef, (querySnapshot) => {
      this.allUsers = querySnapshot.docs.map(doc => {
        return new User({ id: doc.id, ...doc.data() });
      });
      console.log('Users mit ID geladen:', this.allUsers);
    });
  }
}
