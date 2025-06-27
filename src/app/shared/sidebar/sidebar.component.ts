

import { Component, ViewChild, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatMenuModule } from '@angular/material/menu';
import { RouterModule, Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatDrawer, MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { CommonModule } from '@angular/common';

import { FirestoreService } from '../../services/firestore.service';
import { AvatarService } from '../../services/avatar.service';
import { UserDataService, UserProfile } from '../../services/user_data.service';
import { ChatNavigationService } from '../../services/chat-navigation.service';
import { firstValueFrom } from 'rxjs';

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
  currentUserEmail: string = '';
  // channels = ['General', 'Frontend', 'Backend'];
  channels: any[] = [];


  constructor(
    private firestore: FirestoreService,
    private avatarService: AvatarService,
    private userService: UserDataService,
    private router: Router,
    private chatNavigationService: ChatNavigationService
  ) { }

  ngOnInit() {

    this.loadCurrentUser();
    this.loadUsersInSidebar();
    this.loadChannelsInSidebar();

  }

  loadCurrentUser() {
    // Aktuellen Benutzer holen und dessen E-Mail speichern
    this.userService.user$.subscribe((user: UserProfile | null) => {
      if (user) {
        this.currentUserEmail = user.email || '';
      }
    });
  }

  loadUsersInSidebar() {
    // Alle Benutzer aus Firestore laden und aufbereiten
    this.firestore.getAllUsers().subscribe(users => {
      this.users = users.documents.map((doc: any, index: number) => {
        const name = doc.fields.name?.stringValue || 'Unbekannt';
        const avatar = doc.fields.avatar?.stringValue || this.avatarService.profileArray[index % this.avatarService.profileArray.length];
        const email = doc.fields.email?.stringValue || 'unbekannt@email.com';

        return { name, avatar, email };
      });
    });
  }


  loadChannelsInSidebar() {
    console.log("channels laden gestartet");

    this.firestore.getAllChannels().subscribe((response: any) => {
      console.log("📡 Channels geladen:", response);

      if (response?.documents) {
        this.channels = response.documents.map((doc: any) => {
          return doc.fields?.name?.stringValue || 'Unbenannt';
        });
        console.log("📄 Channels extrahiert:", this.channels);
      } else {
        console.warn("⚠️ Keine Channels gefunden oder falsches Format:", response);
        this.channels = [];
      }
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

    const newChannelName = prompt('Name des neuen Channels eingeben:');
    if (!newChannelName || newChannelName.trim().length === 0) {
      console.log('Kein Channelname eingegeben, Abbruch.');
      return;
    }

    const trimmedName = newChannelName.trim();

    // Firestore-Service aufrufen, um den neuen Channel anzulegen
    this.firestore.createChannel(trimmedName).then(() => {
      console.log(`Neuer Channel "${trimmedName}" wurde hinzugefügt.`);

      // Lokal im Array hinzufügen, damit UI sofort aktualisiert wird
      this.channels.push(trimmedName);

      // Optional: Channels-Liste nochmal neu laden aus Firestore
      // this.loadChannelsInSidebar();
    }).catch((error) => {
      console.error('Fehler beim Hinzufügen des Channels:', error);
    });
  }


  getChatId(email1: string, email2: string): string {
    const participants = [email1, email2].sort();
    return `chat_${participants[0]}_${participants[1]}`;
  }


  async openChatWithUser(otherEmail: string, otherName: string) {
    const chatId = this.getChatId(this.currentUserEmail, otherEmail);

    try {
      const chatDoc = await firstValueFrom(this.firestore.getChatById(chatId));

      if (!chatDoc || Object.keys(chatDoc).length === 0) {
        await this.firestore.createChat(chatId, [this.currentUserEmail, otherEmail]);
        console.log('🟢 Neuer Chat wurde erstellt:', chatId);
      } else {
        console.log('ℹ️ Chat existiert bereits:', chatId);
      }

      this.router.navigate(['/directMessage', chatId], { queryParams: { name: otherName } });
      console.log("richtiger chat offen");

    } catch (error) {
      console.error('❌ Fehler beim Öffnen oder Erstellen des Chats:', error);
    }
  }


  openChannelChat(channelId: string) {
    this.router.navigate(['/channelChat', channelId]);
  }



}
