
import { Component, ViewChild, OnInit, ChangeDetectorRef } from '@angular/core';
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
import { firstValueFrom, Subscription } from 'rxjs';
import { AddChannelComponent } from "../../add-channel/add-channel.component";
import { collection } from 'firebase/firestore';
import { collectionData } from '@angular/fire/firestore';

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
    AddChannelComponent
],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss',
})
export class SidebarComponent implements OnInit {
  showChannels: boolean = false;
  showAddChannel: boolean = false;
  showDMs: boolean = false;
  users: any[] = [];
  chats: any[] = [];
  currentUserEmail: string = '';
  currentUserName: string = '';
  currentUserImage: string = '/assets/img/dummy_pic.png';
  isOnline: boolean = true;
  channels: any[] = [];
  private subscription: Subscription = new Subscription();

  constructor(
    private firestore: FirestoreService,
    private avatarService: AvatarService,
    private userService: UserDataService,
    private router: Router,
    private chatNavigationService: ChatNavigationService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit() {
    this.loadCurrentUser();
    this.loadUsersInSidebar();
    this.loadChannelsInSidebar();
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  loadCurrentUser() {
    this.subscription = this.userService.user$.subscribe((user: UserProfile | null) => {
      if (user) {
        this.currentUserEmail = user.email || '';
        this.currentUserName = user.name || 'Unbekannt';
        this.currentUserImage = user.profileImage || '/assets/img/dummy_pic.png';
        this.cdr.detectChanges();
      }
    });
  }

  loadUsersInSidebar() {
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
    this.firestore.getAllChannels().subscribe((response: any) => {
      if (response?.documents) {
        this.channels = response.documents.map((doc: any) => {
          return doc.fields?.name?.stringValue || 'Unbenannt';
        });
      } else {
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
    this.showAddChannel = true;
    event?.stopPropagation();
    console.log(22);
    

    // const newChannelName = prompt('Name des neuen Channels eingeben:');
    // if (!newChannelName || newChannelName.trim().length === 0) {
    //   return;
    // }

    // const trimmedName = newChannelName.trim();
    // this.firestore.createChannel(trimmedName).then(() => {
    //   this.channels.push(trimmedName);
    // }).catch((error) => {});
  }

    onChannelAdded(newChannelName: string) {
    // this.channels.push(newChannelName);

       this.firestore.createChannel(newChannelName).then(() => {
      this.channels.push(newChannelName);
    }).catch((error) => {});
  }


    // auskommentiert weil part mit der funktion createChatAlt() wird nicht benötigt

  // async openChatWithUser(otherEmail: string, otherName: string, otherAvatar: string) {
  //   const currentUser = await firstValueFrom(this.userService.user$);
  //   const currentUserName = currentUser?.name || 'Unbekannt';
    
  //   const chatId = this.firestore.generateChatId(this.currentUserEmail, otherEmail);
    
  //   try {
  //     try {
  //       const chatDoc = await firstValueFrom(this.firestore.getChatById(chatId));
  //       this.navigateToChat(chatId, otherName, otherAvatar);
  //     } 
  //     catch (getError) {
  //       if ((getError as { status: number }).status === 404) {
  //         try {
  //           await this.firestore.createChat(
  //             chatId,
  //             [this.currentUserEmail, otherEmail],
  //             [currentUserName, otherName]
  //           );
  //           this.navigateToChat(chatId, otherName, otherAvatar);
  //         } 
  //         catch (createError1) {
  //           try {
  //             await this.firestore.createChatAlt(
  //               chatId,
  //               [this.currentUserEmail, otherEmail],
  //               [currentUserName, otherName]
  //             );
  //             this.navigateToChat(chatId, otherName, otherAvatar);
  //           } 
  //           catch (createError2) {
  //             alert('Es konnte kein Chat erstellt werden. Bitte versuche es später erneut.');
  //           }
  //         }
  //       } 
  //       else {
  //         alert('Es gab einen Fehler beim Abrufen des Chats. Bitte versuche es später erneut.');
  //       }
  //     }
  //   } 
  //   catch (error) {
  //     alert('Es ist ein unerwarteter Fehler aufgetreten. Bitte versuche es später erneut.');
  //   }
  // }

async openChatWithUser(otherEmail: string, otherName: string, otherAvatar: string) {
  const currentUser = await firstValueFrom(this.userService.user$);
  const currentUserName = currentUser?.name || 'Unbekannt';

  const chatId = this.firestore.generateChatId(this.currentUserEmail, otherEmail);

  try {
    await firstValueFrom(this.firestore.getChatById(chatId));
    this.navigateToChat(chatId, otherName, otherAvatar);
  } catch (getError) {
    const status = (getError as { status?: number })?.status;

    if (status === 404) {
      try {
        await this.firestore.createChat(
          chatId,
          [this.currentUserEmail, otherEmail],
          [currentUserName, otherName]
        );
        this.navigateToChat(chatId, otherName, otherAvatar);
      } catch (createError) {
        alert('Es konnte kein Chat erstellt werden. Bitte versuche es später erneut.');
      }
    } else {
      alert('Es gab einen Fehler beim Abrufen des Chats. Bitte versuche es später erneut.');
    }
  }
}



  private navigateToChat(chatId: string, otherName: string, otherAvatar: string) {
    this.router.navigate(['/directMessage', chatId], {
      queryParams: {
        name: otherName,
        avatar: otherAvatar
      }
    });
  }

  openChannelChat(channelId: string) {
    this.router.navigate(['/channelChat', channelId]);
  }
}
