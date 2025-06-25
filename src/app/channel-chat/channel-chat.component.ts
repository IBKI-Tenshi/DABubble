// import { Component, OnInit, OnDestroy } from '@angular/core';
// import { ActivatedRoute } from '@angular/router';
// import { Subscription } from 'rxjs';

// import { ChatNavigationService } from '../services/chat-navigation.service';

// @Component({
//   selector: 'app-channel-chat',
//   standalone: true,
//   imports: [],
//   templateUrl: './channel-chat.component.html',
//   styleUrls: ['./channel-chat.component.scss']
// })
// export class ChannelChatComponent implements OnInit, OnDestroy {
//   channelName: string | null = null;

//   private routeSub!: Subscription;
//   private refreshSub!: Subscription;

//   constructor(
//     private route: ActivatedRoute,
//     private chatNavigationService: ChatNavigationService
//   ) {}

//   ngOnInit() {
//     this.routeSub = this.route.paramMap.subscribe(params => {
//       const channelId = params.get('channelId');
//       if (channelId) {
//         this.channelName = channelId;
//         console.log('Channel gewechselt:', channelId);

//         this.chatNavigationService.triggerRefresh(channelId);
//       }
//     });

//     this.refreshSub = this.chatNavigationService.refresh$.subscribe(channelId => {
//       if (channelId === this.channelName) {
//         console.log('Refresh event für aktuellen Channel:', channelId);
//       }
//     });
//   }

//   ngOnDestroy() {
//     this.routeSub.unsubscribe();
//     this.refreshSub.unsubscribe();
//   }
// }


import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';

import { FirestoreService } from '../services/firestore.service';
import { Message } from '../../models/message.model';
import { NgFor } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Timestamp } from '@angular/fire/firestore';

@Component({
  selector: 'app-channel-chat',
  standalone: true,
  imports: [NgFor,
    FormsModule,
  ],
  templateUrl: './channel-chat.component.html',
  styleUrls: ['./channel-chat.component.scss']
})
export class ChannelChatComponent implements OnInit, OnDestroy {
  channelName: string | null = null;
  messages: Message[] = [];

    newMessageText: string = '';
  senderName: string = 'Max'; // Oder dynamisch setzen

  private routeSub!: Subscription;
  private messageSub!: Subscription;

  constructor(
    private route: ActivatedRoute,
    private firestoreService: FirestoreService
  ) {}

  ngOnInit() {
    this.routeSub = this.route.paramMap.subscribe(params => {
      const channelId = params.get('channelId');
      if (channelId) {
        this.channelName = channelId;
        console.log('Channel gewechselt:', channelId);

        this.subscribeToMessages(channelId);
      }
    });
  }

  ngOnDestroy() {
    this.routeSub.unsubscribe();

    if (this.messageSub) {
      this.messageSub.unsubscribe();
    }
  }

  private subscribeToMessages(channelId: string): void {
    // Vorherige Subscription beenden, falls vorhanden
    if (this.messageSub) {
      this.messageSub.unsubscribe();
    }

    console.log("📡 Abonniere Nachrichten-Stream für Channel:", channelId);

    this.messageSub = this.firestoreService.getChannelMessages(channelId).subscribe((msgs: Message[]) => {
      console.log("📨 Neue Nachrichten erhalten für Channel:", channelId, msgs);
      // Optional: Sortieren nach Timestamp, falls nicht bereits sortiert
      this.messages = msgs.sort((a, b) => a.timestamp.toDate().getTime() - b.timestamp.toDate().getTime());
    });
  }


    async sendMessage(): Promise<void> {
    if (!this.newMessageText.trim() || !this.channelName) return;

    const newMessage: Message = {
      text: this.newMessageText,
      senderId: this.senderName,
      timestamp: Timestamp.now()
    };

    try {
      await this.firestoreService.addMessageToChannel(this.channelName, newMessage);
      this.newMessageText = '';
      console.log("✅ Nachricht im Channel erfolgreich gesendet");
    } catch (error) {
      console.error('❌ Fehler beim Senden der Nachricht im Channel:', error);
    }
  }


}
