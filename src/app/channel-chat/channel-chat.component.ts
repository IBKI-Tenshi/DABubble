


// import { Component, OnInit, OnDestroy } from '@angular/core';
// import { ActivatedRoute } from '@angular/router';
// import { Subscription } from 'rxjs';

// import { FirestoreService } from '../services/firestore.service';
// import { Message } from '../../models/message.model';
// import { NgFor } from '@angular/common';
// import { FormsModule } from '@angular/forms';
// import { Timestamp } from '@angular/fire/firestore';



// @Component({
//   selector: 'app-channel-chat',
//   standalone: true,
//   imports: [NgFor,
//     FormsModule,
//   ],
//   templateUrl: './channel-chat.component.html',
//   styleUrls: ['./channel-chat.component.scss']
// })
// export class ChannelChatComponent implements OnInit, OnDestroy {
//   channelName: string | null = null;
//   messages: Message[] = [];

//   newMessageText: string = '';
//   senderName: string = 'Max'; // Oder dynamisch setzen

//   private routeSub!: Subscription;
//   private messageSub!: Subscription;

//   constructor(
//     private route: ActivatedRoute,
//     private firestoreService: FirestoreService
//   ) { }

//   ngOnInit() {
//     this.routeSub = this.route.paramMap.subscribe(params => {
//       const channelId = params.get('channelId');
//       if (channelId) {
//         this.channelName = channelId;
//         console.log('Channel gewechselt:', channelId);

//         this.loadMessages(channelId);
//       }
//     });
//   }

//   ngOnDestroy() {
//     this.routeSub.unsubscribe();

//     if (this.messageSub) {
//       this.messageSub.unsubscribe();
//     }
//   }

//   private loadMessages(channelId: string): void {
//     if (this.messageSub) {
//       this.messageSub.unsubscribe();
//     }

//     console.log("📡 Lade Channel-Nachrichten für:", channelId);

//     this.messageSub = this.firestoreService.getChannelMessages(channelId).subscribe((response: any) => {
//       const documents = response?.documents || [];

//       const messagesArray: Message[] = documents.map((doc: any) => {
//         return {
//           senderId: doc.fields.senderId.stringValue,
//           text: doc.fields.text.stringValue,
//           timestamp: new Date(doc.fields.timestamp.timestampValue),
//         };
//       });

//       this.messages = messagesArray.sort((a, b) =>
//         a.timestamp.getTime() - b.timestamp.getTime()
//       );
//     });
//   }


//   async sendMessage(): Promise<void> {
//     if (!this.newMessageText.trim() || !this.channelName) return;

//     const newMessage: Message = {
//       text: this.newMessageText,
//       senderId: this.senderName,
//       timestamp: new Date()
//     };

//     try {
//       // Nachricht über REST-API an Firestore senden
//       await this.firestoreService.addMessageToChannel(this.channelName, newMessage);

//       // Direkt lokal zur Anzeige hinzufügen (für sofortiges Feedback)
//       this.messages.push(newMessage);
//       this.messages.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

//       // Eingabefeld zurücksetzen
//       this.newMessageText = '';

//       console.log("✅ Nachricht im Channel erfolgreich gesendet");
//     } catch (error) {
//       console.error('❌ Fehler beim Senden der Nachricht im Channel:', error);
//     }
//   }


// }



import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { FirestoreService } from '../services/firestore.service';
import { Message } from '../../models/message.model';
import { NgFor } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-channel-chat',
  standalone: true,
  imports: [NgFor, FormsModule],
  templateUrl: './channel-chat.component.html',
  styleUrls: ['./channel-chat.component.scss']
})
export class ChannelChatComponent implements OnInit, OnDestroy {
  messages: Message[] = [];
  newMessageText: string = '';
  senderName: string = 'Max'; // Später dynamisch
  channelId: string = '';
  channelName: string = '';   // Optionaler Anzeigename

  private routeSub!: Subscription;
  private messageSub!: Subscription;

  constructor(
    private route: ActivatedRoute,
    private firestoreService: FirestoreService
  ) { }

  ngOnInit(): void {
    console.log('ngOnInit wurde einmalig aufgerufen');

    this.routeSub = this.route.paramMap.subscribe(params => {
      const id = params.get('channelId');
      if (id) {
        console.log('📦 Neue channelId erhalten aus ParamMap:', id);
        this.channelId = id;
        this.channelName = id; // oder dynamischer Anzeigename
        this.loadMessages();
      }
    });
  }

  ngOnDestroy(): void {
    if (this.routeSub) this.routeSub.unsubscribe();
    if (this.messageSub) this.messageSub.unsubscribe();
  }

  loadMessages(): void {
    if (this.messageSub) {
      this.messageSub.unsubscribe();
    }

    console.log("📡 Abonniere Channel-Nachrichten-Stream von Firestore (REST)");

    this.messageSub = this.firestoreService.getChannelMessages(this.channelId).subscribe((response: any) => {
      console.log("📨 Neue Channel-Nachrichten erhalten:", response);

      const documents = response?.documents || [];

      const messagesArray: Message[] = documents.map((doc: any) => {
        return {
          senderId: doc.fields.senderId.stringValue,
          text: doc.fields.text.stringValue,
          timestamp: new Date(doc.fields.timestamp.timestampValue),
        };
      });

      this.messages = messagesArray.sort((a, b) =>
        a.timestamp.getTime() - b.timestamp.getTime()
      );
    });
  }

  async sendMessage(): Promise<void> {
    if (!this.newMessageText.trim()) return;

    const newMessage: Message = {
      text: this.newMessageText,
      senderId: this.senderName,
      timestamp: new Date()
    };

    try {
      await this.firestoreService.addMessageToChannel(this.channelId, newMessage);

      // 🟢 Direkt lokal zur Anzeige hinzufügen
      this.messages.push(newMessage);
      this.messages.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

      this.newMessageText = '';
      console.log("✅ Nachricht erfolgreich im Channel gesendet");
    } catch (error) {
      console.error('❌ Fehler beim Senden der Channel-Nachricht:', error);
    }
  }
}
