// direct-message.component.ts

import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { FirestoreService } from '../services/firestore.service';
import { Message } from '../models/message.model';
import { ActivatedRoute } from '@angular/router';
import { ChatNavigationService } from '../services/chat-navigation.service';
import { AvatarService } from '../services/avatar.service';
import { Subscription } from 'rxjs';
import { UserDataService, UserProfile } from '../services/user_data.service';

interface GroupedMessages {
  date: Date;
  dateLabel: string;
  messages: Message[];
}

@Component({
  selector: 'app-direct-message',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  templateUrl: './direct-message.component.html',
  styleUrls: ['./direct-message.component.scss']
})
export class DirectMessageComponent implements OnInit, OnDestroy {
  messages: Message[] = [];
  groupedMessages: GroupedMessages[] = [];
  newMessageText: string = '';
  senderName: string = 'Frederik Beck';
  senderAvatar: string = '/assets/img/dummy_pic.png';
  chatId: string = '';
  partnerName: string = 'Lara Lindt';
  partnerAvatarUrl: string = '/assets/img/dummy_pic.png';
  isSending: boolean = false;

  private routeSub!: Subscription;
  private querySub!: Subscription;
  private messageSub!: Subscription;
  private userSub!: Subscription;

  constructor(
    private firestore: FirestoreService,
    private route: ActivatedRoute,
    private chatNavigationService: ChatNavigationService,
    private avatarService: AvatarService,
    private userService: UserDataService
  ) { }

  ngOnInit(): void {
    this.loadCurrentUser();

    this.querySub = this.route.queryParams.subscribe(params => {
      this.partnerName = params['name'] || 'Lara Lindt';
      this.partnerAvatarUrl = params['avatar'] || '/assets/img/dummy_pic.png';
    });

    this.routeSub = this.route.paramMap.subscribe(params => {
      const id = params.get('chatId');
      console.log('Route-Parameter erhalten:', params);
      if (id) {
        console.log(`Chat-ID aus Route: ${id}`);
        this.chatId = id;
        this.loadMessages();
      } else {
        console.error('Keine Chat-ID in den Route-Parametern gefunden!');
      }
    });
  }

  loadCurrentUser(): void {
    this.userSub = this.userService.user$.subscribe((user: UserProfile | null) => {
      if (user) {
        this.senderName = user.name || 'Frederik Beck';
        this.senderAvatar = user.profileImage || '/assets/img/dummy_pic.png';
      }
    });
  }

  ngOnDestroy(): void {
    if (this.routeSub) this.routeSub.unsubscribe();
    if (this.querySub) this.querySub.unsubscribe();
    if (this.messageSub) this.messageSub.unsubscribe();
    if (this.userSub) this.userSub.unsubscribe();
  }

  // Hinzufügen der fehlenden getAvatarForUser-Methode
  getAvatarForUser(userId: string): string {
    if (userId === this.senderName) {
      return this.senderAvatar;
    }
    return this.partnerAvatarUrl;
  }

  loadMessages(): void {
    if (this.messageSub) {
      this.messageSub.unsubscribe();
    }

    if (!this.chatId) {
      console.error('Keine Chat-ID vorhanden!');
      return;
    }

    console.log(`Lade Nachrichten für Chat ${this.chatId}...`);

    this.messageSub = this.firestore.getChatMessages(this.chatId)
      .subscribe({
        next: (response: any) => {
          console.log('Chat-Nachrichten erhalten:', response);
          const documents = response?.documents || [];

          if (documents.length === 0) {
            console.log(`Keine Nachrichten für Chat ${this.chatId} gefunden.`);
          }

          this.messages = documents.map((doc: any) => {
            const senderId = doc.fields.senderId.stringValue;
            return {
              id: doc.name.split('/').pop(),
              senderId: senderId,
              text: doc.fields.text.stringValue,
              timestamp: new Date(doc.fields.timestamp.timestampValue),
              avatar: doc.fields.avatar?.stringValue || this.getAvatarForUser(senderId),
              reactions: doc.fields.reactions?.arrayValue?.values?.map((r: any) => ({
                emoji: r.mapValue.fields.emoji.stringValue,
                count: parseInt(r.mapValue.fields.count.integerValue),
                users: r.mapValue.fields.users.arrayValue.values.map((u: any) => u.stringValue)
              })) || []
            };
          }).sort((a: Message, b: Message) => a.timestamp.getTime() - b.timestamp.getTime());

          console.log(`${this.messages.length} Nachrichten für Chat ${this.chatId} geladen.`);
          this.groupMessagesByDate();
        },
        error: (error) => {
          console.error(`Fehler beim Laden der Nachrichten für Chat ${this.chatId}:`, error);
        }
      });
  }

  groupMessagesByDate(): void {
    // Nachrichten nach Datum gruppieren
    const groupedObj: { [key: string]: GroupedMessages } = {};
    
    // Wenn keine Nachrichten vorhanden sind
    if (this.messages.length === 0) {
      this.groupedMessages = [];
      return;
    }
    
    for (const message of this.messages) {
      const date = new Date(message.timestamp);
      date.setHours(0, 0, 0, 0); // Nur Datum ohne Zeit
      
      const dateStr = date.toISOString();
      
      // Datumsbezeichnung erstellen
      let dateLabel: string;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);
      
      if (date.getTime() === today.getTime()) {
        dateLabel = 'Heute';
      } else if (date.getTime() === yesterday.getTime()) {
        dateLabel = 'Gestern';
      } else {
        // Format: Dienstag, 14 Januar - mit nativer JavaScript-Methode
        const options: Intl.DateTimeFormatOptions = { 
          weekday: 'long', 
          day: 'numeric', 
          month: 'long' 
        };
        dateLabel = date.toLocaleDateString('de-DE', options);
        // Erster Buchstabe groß (falls nötig)
        dateLabel = dateLabel.charAt(0).toUpperCase() + dateLabel.slice(1);
      }
      
      if (!groupedObj[dateStr]) {
        groupedObj[dateStr] = {
          date: date,
          dateLabel: dateLabel,
          messages: []
        };
      }
      
      groupedObj[dateStr].messages.push(message);
    }
    
    // In Array umwandeln und nach Datum sortieren
    this.groupedMessages = Object.values(groupedObj).sort(
      (a, b) => a.date.getTime() - b.date.getTime()
    );
  }

  async sendMessage(): Promise<void> {
    if (this.isSending || !this.newMessageText.trim()) return;

    this.isSending = true;
    
    const newMessage: Message = {
      text: this.newMessageText,
      senderId: this.senderName,
      timestamp: new Date(),
      avatar: this.senderAvatar,
      reactions: []
    };
    
    // Text zwischenspeichern und Feld leeren
    const messageText = this.newMessageText;
    this.newMessageText = '';

    try {
      // Lokale Anzeige aktualisieren
      const tempId = Date.now().toString();
      const tempMessage = { ...newMessage, id: tempId };
      this.messages.push(tempMessage);
      this.groupMessagesByDate();
      
      // An Server senden
      await this.firestore.addMessageToChat(this.chatId, newMessage);
      console.log('Nachricht erfolgreich gesendet');
    } catch (error) {
      console.error('Fehler beim Senden der Nachricht:', error);
      
      // Bei Fehler: Text wiederherstellen
      this.newMessageText = messageText;
      
      // Fehlerhafte Nachricht entfernen (tempId nicht definiert, daher nicht nötig)
      
      alert('Nachricht konnte nicht gesendet werden. Bitte versuche es erneut.');
    } finally {
      this.isSending = false;
    }
  }
  
  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }
}