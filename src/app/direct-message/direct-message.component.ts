


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
  ) { }

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
        this.loadMessages();
      }
    });
  }

  ngOnDestroy(): void {
    if (this.routeSub) this.routeSub.unsubscribe();
    if (this.querySub) this.querySub.unsubscribe();
    if (this.messageSub) this.messageSub.unsubscribe();
  }

  loadMessages(): void {
    if (this.messageSub) {
      this.messageSub.unsubscribe();
    }

    console.log("📡 Abonniere Nachrichten-Stream von Firestore (REST)");

    this.messageSub = this.firestore.getChatMessages(this.chatId).subscribe((response: any) => {
      console.log("📨 Neue Nachrichten erhalten:", response);

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
    await this.firestore.addMessageToChat(this.chatId, newMessage);

    // 🟢 Direkt nach dem Senden lokal zur Anzeige hinzufügen:
    this.messages.push(newMessage);
    this.messages.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

    this.newMessageText = '';
    console.log("✅ Nachricht erfolgreich gesendet");
  } catch (error) {
    console.error('❌ Fehler beim Senden der Nachricht:', error);
  }
}


}
