import { Component, ViewChild, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatMenuModule } from '@angular/material/menu';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatDrawer, MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { CommonModule } from '@angular/common';

import { FirestoreService } from '../../services/firestore.service';
import { AvatarService } from '../../services/avatar.service';


@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [
    CommonModule,
    MatToolbarModule,
    MatSidenavModule,
    MatIconModule,
    RouterModule,
    MatMenuModule,
    MatButtonModule,
    MatDialogModule,
    MatDrawer,
  ],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss',
})
export class SidebarComponent implements OnInit {
  showChannels = false;
  showDMs: boolean = false;

  users: any[] = [];

  channels = ['General', 'Frontend', 'Backend'];

  constructor(
    private firestore: FirestoreService,
    private avatarService: AvatarService
  ) { }

  ngOnInit() {
    this.firestore.getAllUsers().subscribe(users => {
      this.users = users.documents.map((doc: any, index: number) => {
        const name = doc.fields.name?.stringValue || 'Unbekannt';
        const avatar =
          doc.fields.avatar?.stringValue ||
          this.avatarService.profileArray[index % this.avatarService.profileArray.length];

        return { name, avatar };
      });
    });
  }


  toggleChannels() {
    this.showChannels = !this.showChannels;
  }

  toggleDMs() {
    this.showDMs = !this.showDMs;
  }

  addChannel(event?: MouseEvent) {
    event?.stopPropagation();
    console.log('Neuer Channel hinzufügen');
    // hier kommt später dein Logik-Code für das Hinzufügen eines Channels
  }
}
