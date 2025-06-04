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

import { Firestore, collection, addDoc } from '@angular/fire/firestore';
import { NgIf } from '@angular/common';


@Component({
   selector: 'app-dialog-add-user',
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
      NgIf],
   templateUrl: './dialog-add-user.component.html',
   styleUrl: './dialog-add-user.component.scss'
})
export class DialogAddUserComponent {
   // firestore: Firestore = Inject(Firestore);

   user = new User();
   birthDate!: Date;    // "!" heißt wir versprechen, dass ein wert zugewiesen wird
   loading = false;
   // loading = true;

   // constructor(private dialogRef: MatDialogRef<DialogAddUserComponent>) { }
   constructor(private firestore: Firestore, private dialogRef: MatDialogRef<DialogAddUserComponent>) { }


   cancelUser() {
      this.dialogRef.close();
   }

   saveUser() {
      this.user.birthDate = this.birthDate.getTime();
      console.log('current user is', this.user);
      this.loading = true;

      const userCollection = collection(this.firestore, 'users');
      addDoc(userCollection, this.user.toJSON()).then((result) => {
         console.log('adding user finished', result);
         this.loading = false;
         this.dialogRef.close(); // optional: Dialog schließen nach Speichern
      });

   }




}
