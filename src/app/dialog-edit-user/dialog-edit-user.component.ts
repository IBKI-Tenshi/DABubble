import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogActions, MatDialogContent, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { FormsModule } from '@angular/forms';      // benötigt für [(ngModel)] im html
import { Inject } from '@angular/core';   // benötigt um "user" aus der virherigen komponente zu übernehemen
import { MAT_DIALOG_DATA } from '@angular/material/dialog';   // benötigt um "user" aus der virherigen komponente zu übernehemen
import { Firestore, doc, updateDoc } from '@angular/fire/firestore';

import { User } from '../../models/user.class';
import { NgIf } from '@angular/common';

@Component({
  selector: 'app-dialog-edit-user',
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
  templateUrl: './dialog-edit-user.component.html',
  styleUrl: './dialog-edit-user.component.scss'
})
export class DialogEditUserComponent {

  user: User = new User();
  userId: string = '';
  birthDate!: Date;    // "!" heißt wir versprechen, dass ein wert zugewiesen wird
  loading = false;

  // constructor(
  //   private dialogRef: MatDialogRef<DialogEditUserComponent>,
  //   @Inject(MAT_DIALOG_DATA) public user: User    // hier wird "user" aus der vorherigen komponente übergeben
  // ) { }

  constructor(private firestore: Firestore, private dialogRef: MatDialogRef<DialogEditUserComponent>) { }

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



  cancelUser() {
    this.dialogRef.close();
  }

}
