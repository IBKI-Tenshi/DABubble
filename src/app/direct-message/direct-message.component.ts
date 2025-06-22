

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FirestoreService } from '../services/firestore.service';
import { Message } from '../../models/message.model';
import { ActivatedRoute } from '@angular/router';
import { Timestamp } from 'firebase/firestore';

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
    private route: ActivatedRoute
  ) { }

  async ngOnInit(): Promise<void> {
    this.route.paramMap.subscribe(async params => {
      const id = params.get('chatId');
      if (id) {
        this.chatId = id;

        const chatDoc = await this.firestore.getChatById(this.chatId);
        if (chatDoc.exists()) {
          this.loadMessages();
        } else {
          console.log('Chat existiert nicht.');
        }
      }
    });
  }


// timestamp als timestamp

// loadMessages(): void {
//   console.log("loadMessages triggered");

//   this.firestore.getChatMessages(this.chatId).subscribe((msgs: Message[]) => {
//     console.log("load Messages: Nachrichten erhalten von Firestore:", msgs);
//     console.log(this.messages);
//     this.messages = msgs.sort((a, b) =>
//       a.timestamp.toDate().getTime() - b.timestamp.toDate().getTime()  
//     );
//     console.log("loadMessages hat geklappt");
    
//   });
// }



// timestamp als string
loadMessages(): void {
  console.log("loadMessages triggered");

  this.firestore.getChatMessages(this.chatId).subscribe((msgs: Message[]) => {
    this.messages = msgs.sort((a, b) =>
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
  });

}


  async sendMessage(): Promise<void> {
    if (!this.newMessageText.trim()) return;

    const newMessage: Message = {
      text: this.newMessageText,
      senderId: this.senderName,
      timestamp: new Date().toISOString()
      // timestamp: Timestamp.now()
    };

    try {
      await this.firestore.addMessageToChat(this.chatId, newMessage);
      this.newMessageText = '';
    } catch (error) {
      console.error(' Fehler beim Senden der Nachricht:', error);
    }
  }
}
