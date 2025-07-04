// src/app/thread/thread.component.ts
import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Message, ThreadReply } from '../models/message.model'; // Beide Interfaces importieren
import { FirestoreService } from '../services/firestore.service';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-thread',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, MatButtonModule],
  templateUrl: './thread.component.html',
  styleUrls: ['./thread.component.scss']
})
export class ThreadComponent implements OnInit {
  @Input() parentMessage?: Message;
  @Input() channelId?: string;
  @Input() chatId?: string;
  @Output() onClose = new EventEmitter<void>();
  
  replies: Message[] = [];
  newReplyText: string = '';
  senderName: string = 'Max';  // Später dynamisch
  
  constructor(private firestore: FirestoreService) {}
  
  ngOnInit(): void {
    if (this.parentMessage?.id) {
      this.loadThreadReplies();
    }
  }
  
  loadThreadReplies(): void {
    if (!this.parentMessage?.id) return;
    
    this.firestore.getThreadMessages(this.parentMessage.id).subscribe((response: any) => {
      const documents = response?.documents || [];
      
      this.replies = documents.map((doc: any) => {
        return {
          id: doc.name.split('/').pop(),
          senderId: doc.fields.senderId.stringValue,
          text: doc.fields.text.stringValue,
          timestamp: new Date(doc.fields.timestamp.timestampValue),
          threadId: doc.fields.threadId?.stringValue
        };
      }).sort((a: Message, b: Message) => a.timestamp.getTime() - b.timestamp.getTime());
    });
  }
  
  async sendReply(): Promise<void> {
    if (!this.newReplyText.trim() || !this.parentMessage?.id) return;
    
    // Hier ein ThreadReply-Objekt erstellen statt Message
    const reply: ThreadReply = {
      text: this.newReplyText,
      senderId: this.senderName,
      timestamp: new Date(),
      threadId: this.parentMessage.id // Hier ist threadId immer definiert
    };
    
    try {
      await this.firestore.addReplyToThread(this.parentMessage.id, reply);
      
      // Aktualisiere die Anzahl der Antworten für die übergeordnete Nachricht
      const newCount = (this.parentMessage.threadRepliesCount || 0) + 1;
      await this.firestore.updateThreadRepliesCount(this.parentMessage.id);
      
      // Lokale Anzeige aktualisieren - reply als Message casten, um es zum Array hinzuzufügen
      this.replies.push(reply as unknown as Message);
      this.newReplyText = '';
      
      if (this.parentMessage) {
        this.parentMessage.threadRepliesCount = newCount;
      }
    } catch (error) {
      console.error('Fehler beim Senden der Antwort:', error);
    }
  }
  
  closeThread(): void {
    this.onClose.emit();
  }
}