import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatMenuModule } from '@angular/material/menu';
import { RouterModule, Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { CommonModule } from '@angular/common';

import { FirestoreService } from '../../services/firestore.service';
import { AvatarService } from '../../services/avatar.service';
import { UserDataService, UserProfile } from '../../services/user_data.service';
import { ChatNavigationService } from '../../services/chat-navigation.service';
import { AddChannelComponent } from '../../add-channel/add-channel.component';
import { ChatPartnerService } from '../../services/chat-partner.service';

import { Subscription, combineLatest } from 'rxjs';
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
    AddChannelComponent,
  ],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss',
})
export class SidebarComponent implements OnInit, OnDestroy {
  showChannels = false;
  showAddChannel = false;
  showDMs = true;

  users: Array<{ name: string; email: string; avatar: string }> = [];
  channels: string[] = [];

  currentUserEmail = '';
  currentUserName = '';
  currentUserImage = '/assets/img/dummy_pic.png';
  isOnline = true;

  activeChat = '';

  private sub = new Subscription();

  constructor(
    private firestore: FirestoreService,
    private avatarService: AvatarService,
    private userService: UserDataService,
    private router: Router,
    private chatNavigationService: ChatNavigationService,
    private chatPartnerService: ChatPartnerService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit() {
    this.loadChannelsInSidebar();
    const s = combineLatest([this.userService.user$, this.firestore.getAllUsers()]).subscribe({
      next: ([me, usersResponse]) => {
        if (me) {
          this.currentUserEmail = (me.email || '').toLowerCase();
          this.currentUserName = me.name || 'Unbekannt';
          this.currentUserImage = me.profileImage || '/assets/img/dummy_pic.png';
        }

        const allUsers = (usersResponse?.documents || []).map((doc: any, idx: number) => {
          const name = doc.fields?.name?.stringValue || 'Unbekannt';
          const email = (doc.fields?.email?.stringValue || 'unbekannt@email.com').toLowerCase();
          const avatar =
            doc.fields?.avatar?.stringValue ||
            this.avatarService.profileArray[idx % this.avatarService.profileArray.length];
          return { name, email, avatar };
        });
        this.users = allUsers.filter((u: { email: string; }) => u.email && u.email !== this.currentUserEmail);

        this.cdr.detectChanges();
      },
      error: (e) => console.error('Sidebar load error:', e),
    });

    this.sub.add(s);
  }

  ngOnDestroy() {
    this.sub.unsubscribe();
  }

  toggleChannels() {
    this.showChannels = !this.showChannels;
  }

  toggleDMs() {
    this.showDMs = !this.showDMs;
  }

  loadChannelsInSidebar() {
    const s = this.firestore.getAllChannels().subscribe((response: any) => {
      this.channels = response?.documents
        ? response.documents.map((doc: any) => doc.fields?.name?.stringValue || 'Unbenannt')
        : [];
    });
    this.sub.add(s);
  }

  addChannel(event?: MouseEvent) {
    event?.stopPropagation();
    this.showAddChannel = true;
  }

  onChannelAdded(newChannelName: string) {
    this.firestore.createChannel(newChannelName)
      .then(() => this.channels.push(newChannelName))
      .catch(() => { });
  }

  generateChatId(email1: string, email2: string): string {
    return [email1.toLowerCase(), email2.toLowerCase()].sort().join('_');
  }

  async openChatWithUser(otherEmail: string, otherName: string, otherAvatar: string) {
    const me = await firstValueFrom(this.userService.user$);
    const myName = me?.name || 'Unbekannt';
    const myEmail = (me?.email || '').toLowerCase();

    const chatId = this.firestore.generateChatId(myEmail, otherEmail.toLowerCase());

    this.chatPartnerService.setChatPartner(chatId, otherName, otherAvatar);

    try {
      await firstValueFrom(this.firestore.getChatById(chatId));
      this.navigateToChat(chatId);
    } catch (err: any) {
      if (err?.status === 404) {
        await this.firestore.createChat(
          chatId,
          [myEmail, otherEmail.toLowerCase()],
          [myName, otherName]
        );
        this.navigateToChat(chatId);
      } else {
        console.error('Chat laden/erstellen fehlgeschlagen', err);
      }
    }
  }

  private navigateToChat(chatId: string) {
    this.router.navigate(['/directMessage', chatId]);
  }

  openChannelChat(channelId: string) {
    this.router.navigate(['/channelChat', channelId]);
  }
}
