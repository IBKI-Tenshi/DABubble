import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogActions, MatDialogContent, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatProgressBarModule } from '@angular/material/progress-bar';

import { User } from '../../models/user.class';
import { FormsModule } from '@angular/forms';      // benötigt für [(ngModel)] im html

import { Inject } from '@angular/core';   // benötigt um "user" aus der virherigen komponente zu übernehemen
import { MAT_DIALOG_DATA } from '@angular/material/dialog';   // benötigt um "user" aus der virherigen komponente zu übernehemen


import { Firestore, doc, updateDoc } from '@angular/fire/firestore';
import { NgIf } from '@angular/common';


@Component({
  selector: 'app-dialog-edit-address',
  standalone: true,
  imports: [
    MatDialogContent,
    MatDialogActions,
    MatButtonModule, MatDialogModule,
    MatInputModule,
    MatFormFieldModule,
    MatDatepickerModule,
    MatNativeDateModule,
    FormsModule,
    MatProgressBarModule,
    NgIf
  ],
  templateUrl: './dialog-edit-address.component.html',
  styleUrl: './dialog-edit-address.component.scss'
})
export class DialogEditAddressComponent {

  user: User = new User();
  userId: string = '';
  loading = false;

  // constructor(private firestore: Firestore, private dialogRef: MatDialogRef<DialogEditAddressComponent>) { }

  //   constructor(
  //   // private firestore: Firestore,
  //   private dialogRef: MatDialogRef<DialogEditAddressComponent>,
  //   @Inject(MAT_DIALOG_DATA) public user: User    // hier wird "user" aus der vorherigen komponente übergeben
  // ) { }

  constructor(private firestore: Firestore, private dialogRef: MatDialogRef<DialogEditAddressComponent>) { }

  cancelUser() {
    this.dialogRef.close();
  }

saveUser() {
  this.loading = true;
  const userRef = doc(this.firestore, 'users', this.userId);
  updateDoc(userRef, this.user.toJSON())
    .then(() => {
      console.log('User erfolgreich aktualisiert');
      this.loading = false;
    })
    .catch((error) => {
      console.error('Fehler beim Speichern des Users:', error);
      this.loading = false;
    });
     this.dialogRef.close(); // optional: Dialog schließen nach Speichern
}


}
