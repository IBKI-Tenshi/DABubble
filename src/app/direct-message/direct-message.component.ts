

import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FirestoreService } from '../services/firestore.service';
import { Message } from '../../models/message.model';
import { ActivatedRoute } from '@angular/router';
import { Timestamp } from '@angular/fire/firestore'; // ✅ RICHTIG

import { ChatNavigationService } from '../services/chat-navigation.service';


import { Subscription } from 'rxjs';
@Component({
  selector: 'app-direct-message',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './direct-message.component.html',
  styleUrls: ['./direct-message.component.scss']
})
export class DirectMessageComponent implements OnInit {
  messages: Message[] = [];
  newMessageText: string = '';
  senderName: string = 'Max'; // Später dynamisch
  chatId: string = '';

  constructor(
    private firestore: FirestoreService,
    private route: ActivatedRoute,
    private chatNavigationService: ChatNavigationService,
  ) { }

    private routeSub!: Subscription;

  ngOnInit(): void {
    console.log('ngOnInit wurde einmalig aufgerufen');

    // Achtung: immer neue Subscription bei Param-Änderung!
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
    if (this.routeSub) {
      this.routeSub.unsubscribe();
    }
  }


  

  // timestamp als timestamp
  loadMessages(): void {
    console.log("loadMessages triggered");

    this.firestore.getChatMessages(this.chatId).subscribe((msgs: Message[]) => {
      console.log("load Messages: Nachrichten erhalten von Firestore:", msgs);
      console.log(this.messages);
      this.messages = msgs.sort((a, b) =>
        a.timestamp.toDate().getTime() - b.timestamp.toDate().getTime()  
      );
      console.log("loadMessages hat geklappt");

    });
  }

  // timestamp als string
  // loadMessages(): void {
  //   console.log("loadMessages triggered");
  //   console.log('Chat ID:', this.chatId);

  //   this.firestore.getChatMessages(this.chatId).subscribe((msgs: Message[]) => {
  //     console.log('Geladene Nachrichten:', msgs);
  //     this.messages = msgs.sort((a, b) =>
  //       new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  //     );
  //   });

  // }

  async sendMessage(): Promise<void> {
    if (!this.newMessageText.trim()) return;

    const newMessage: Message = {
      text: this.newMessageText,
      senderId: this.senderName,
      // timestamp: new Date().toISOString()
      timestamp: Timestamp.now()
    };

    try {
      await this.firestore.addMessageToChat(this.chatId, newMessage);
      this.newMessageText = '';
      console.log("senden funktioniert");

    } catch (error) {
      console.error(' Fehler beim Senden der Nachricht:', error);
    }
  }
}