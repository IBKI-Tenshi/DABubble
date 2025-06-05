import { Component } from '@angular/core';

import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialogModule } from '@angular/material/dialog';
import { MatDialog } from '@angular/material/dialog';


import { ActivatedRoute } from '@angular/router';
import { Firestore, doc, onSnapshot, DocumentReference } from '@angular/fire/firestore';
import { User } from '../../models/user.class';
import { DialogEditAddressComponent } from "../dialog-edit-address/dialog-edit-address.component";
import { DialogEditUserComponent } from "../dialog-edit-user/dialog-edit-user.component";

@Component({
  selector: 'app-user-detail',
  standalone: true,
  imports: [
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatDialogModule,

  ],
  templateUrl: './user-detail.component.html',
  styleUrl: './user-detail.component.scss'
})
export class UserDetailComponent {

  userId = '';
  user: User = new User;

  constructor(private firestore: Firestore, private route: ActivatedRoute, public dialog: MatDialog) { }

  ngOnInit(): void {
    this.route.paramMap.subscribe(paramMap => {
      this.userId = paramMap.get('id')!;    // "!" bedeutet wie versprechen es gibt immer eine id also ist nie = 0
      console.log('id holen hat geklappt', this.userId)
      this.getUser();
    })
  }

  getUser() {
    const userRef: DocumentReference = doc(this.firestore, 'users', this.userId);

    onSnapshot(userRef, (docSnap) => {
      if (docSnap.exists()) {
        this.user = new User({ id: docSnap.id, ...docSnap.data() });
        console.log('User geladen:', this.user);
      } else {
        console.warn('Kein User-Dokument gefunden mit dieser ID:', this.userId);
      }
    });
  }

  editUserDetail() {
    (document.activeElement as HTMLElement)?.blur();  // Fokus vom aktuellen Element nehmen
    const dialog = this.dialog.open(DialogEditUserComponent);
    dialog.componentInstance.user = new User(this.user.toJSON());   // Kopie des objektes wird als JSON übergeben nicht das originale objekt
    dialog.componentInstance.userId = this.userId;
  }



  editMenu() {
    (document.activeElement as HTMLElement)?.blur();  // Fokus vom aktuellen Element nehmen
    const dialog = this.dialog.open(DialogEditAddressComponent);
    dialog.componentInstance.user = new User(this.user.toJSON());   // Kopie des objektes wird als JSON übergeben nicht das originale objekt
    dialog.componentInstance.userId = this.userId;
  }

}

