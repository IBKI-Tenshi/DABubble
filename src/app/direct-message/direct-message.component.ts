
// import { Component, OnInit, OnDestroy } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { FormsModule } from '@angular/forms';
// import { FirestoreService } from '../services/firestore.service';
// import { Message } from '../../models/message.model';
// import { ActivatedRoute } from '@angular/router';
// import { Timestamp } from '@angular/fire/firestore';
// import { ChatNavigationService } from '../services/chat-navigation.service';
// import { Subscription } from 'rxjs';

// @Component({
//   selector: 'app-direct-message',
//   standalone: true,
//   imports: [CommonModule, FormsModule],
//   templateUrl: './direct-message.component.html',
//   styleUrls: ['./direct-message.component.scss']
// })
// export class DirectMessageComponent implements OnInit, OnDestroy {
//   messages: Message[] = [];
//   newMessageText: string = '';
//   senderName: string = 'Max'; // Später dynamisch
//   chatId: string = '';
//   partnerName: string = '';

//   private routeSub!: Subscription;
//   private messageSub!: Subscription;

//   constructor(
//     private firestore: FirestoreService,
//     private route: ActivatedRoute,
//     private chatNavigationService: ChatNavigationService,
//   ) {}

//   ngOnInit(): void {
//     console.log('ngOnInit wurde einmalig aufgerufen');

//     this.routeSub = this.route.paramMap.subscribe(params => {
//       const id = params.get('chatId');
//       if (id) {
//         console.log('📦 Neue chatId erhalten aus ParamMap:', id);
//         this.chatId = id;
//         this.subscribeToMessages();
//       }
//     });
//   }

//   ngOnDestroy(): void {
//     if (this.routeSub) {
//       this.routeSub.unsubscribe();
//     }

//     if (this.messageSub) {
//       this.messageSub.unsubscribe();
//     }
//   }

//   /**
//    * 🔁 Holt und abonniert live die Nachrichten für den aktuellen Chat
//    */
//   // subscribeToMessages(): void {
//   //   // Bei Chat-Wechsel vorherige Subscription sauber beenden
//   //   if (this.messageSub) {
//   //     this.messageSub.unsubscribe();
//   //   }

//   //   console.log("📡 Abonniere Nachrichten-Stream von Firestore");

//   //   this.messageSub = this.firestore.getChatMessages(this.chatId).subscribe((msgs: Message[]) => {
//   //     console.log("📨 Neue Nachrichten erhalten:", msgs);
//   //     this.messages = msgs.sort((a, b) =>
//   //       a.timestamp.toDate().getTime() - b.timestamp.toDate().getTime()
//   //     );
//   //   });
//   // }

//   async sendMessage(): Promise<void> {
//     if (!this.newMessageText.trim()) return;

//     const newMessage: Message = {
//       text: this.newMessageText,
//       senderId: this.senderName,
//       timestamp: Timestamp.now()
//     };

//     try {
//       await this.firestore.addMessageToChat(this.chatId, newMessage);
//       this.newMessageText = '';
//       console.log("✅ Nachricht erfolgreich gesendet");
//     } catch (error) {
//       console.error('❌ Fehler beim Senden der Nachricht:', error);
//     }
//   }


// async subscribeToMessages(): Promise<void> {
//   if (this.messageSub) {
//     this.messageSub.unsubscribe();
//   }

//   this.messageSub = this.firestore.getChatMessages(this.chatId).subscribe(async (msgs: Message[]) => {
//     this.messages = msgs.sort((a, b) =>
//       a.timestamp.toDate().getTime() - b.timestamp.toDate().getTime()
//     );

//     // Hole Chat-Daten
//     const chatDoc = await this.firestore.getChatById(this.chatId);
//     const data = chatDoc.data();
//     if (data && data.participants) {
//       // Finde Partner-Email (nicht deine eigene)
//       const partnerEmail = data.participants.find((email: string) => email !== this.senderName);
//       if (partnerEmail) {
//         const partnerUser = await this.firestore.getUserByEmail(partnerEmail);
//         if (partnerUser) {
//           this.partnerName = partnerUser.name || partnerEmail;
//         } else {
//           this.partnerName = partnerEmail; // fallback, falls User nicht gefunden
//         }
//       }
//     }
//   });
// }




  
// }



import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FirestoreService } from '../services/firestore.service';
import { Message } from '../../models/message.model';
import { ActivatedRoute } from '@angular/router';
import { Timestamp } from '@angular/fire/firestore';
import { ChatNavigationService } from '../services/chat-navigation.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-direct-message',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './direct-message.component.html',
  styleUrls: ['./direct-message.component.scss']
})
export class DirectMessageComponent implements OnInit, OnDestroy {
  messages: Message[] = [];
  newMessageText: string = '';
  senderName: string = 'Max'; // Später dynamisch
  chatId: string = '';
  partnerName: string = '';

  private routeSub!: Subscription;
  private querySub!: Subscription;
  private messageSub!: Subscription;

  constructor(
    private firestore: FirestoreService,
    private route: ActivatedRoute,
    private chatNavigationService: ChatNavigationService,
  ) {}

  ngOnInit(): void {
    console.log('ngOnInit wurde einmalig aufgerufen');

    // Hole Query-Parameter (z.B. Partnername)
    this.querySub = this.route.queryParams.subscribe(params => {
      this.partnerName = params['name'] || 'Unbekannt';
      console.log('👤 Partnername erhalten aus Query:', this.partnerName);
    });

    // Hole Chat-ID
    this.routeSub = this.route.paramMap.subscribe(params => {
      const id = params.get('chatId');
      if (id) {
        console.log('📦 Neue chatId erhalten aus ParamMap:', id);
        this.chatId = id;
        this.subscribeToMessages();
      }
    });
  }

  ngOnDestroy(): void {
    if (this.routeSub) this.routeSub.unsubscribe();
    if (this.querySub) this.querySub.unsubscribe();
    if (this.messageSub) this.messageSub.unsubscribe();
  }

  /**
   * 🔁 Holt und abonniert live die Nachrichten für den aktuellen Chat
   */
  subscribeToMessages(): void {
    if (this.messageSub) {
      this.messageSub.unsubscribe();
    }

    console.log("📡 Abonniere Nachrichten-Stream von Firestore");

    this.messageSub = this.firestore.getChatMessages(this.chatId).subscribe((msgs: Message[]) => {
      console.log("📨 Neue Nachrichten erhalten:", msgs);
      this.messages = msgs.sort((a, b) =>
        a.timestamp.toDate().getTime() - b.timestamp.toDate().getTime()
      );
    });
  }

  async sendMessage(): Promise<void> {
    if (!this.newMessageText.trim()) return;

    const newMessage: Message = {
      text: this.newMessageText,
      senderId: this.senderName,
      timestamp: Timestamp.now()
    };

    try {
      await this.firestore.addMessageToChat(this.chatId, newMessage);
      this.newMessageText = '';
      console.log("✅ Nachricht erfolgreich gesendet");
    } catch (error) {
      console.error('❌ Fehler beim Senden der Nachricht:', error);
    }
  }
}
