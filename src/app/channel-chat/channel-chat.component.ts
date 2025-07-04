import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { FirestoreService } from '../services/firestore.service';
import { Message, ThreadReply } from '../models/message.model';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { UserDataService, UserProfile } from '../services/user_data.service';

interface ChannelMember {
  name: string;
  avatar: string;
}

interface GroupedMessages {
  date: Date;
  dateLabel: string;
  messages: Message[];
}

@Component({
  selector: 'app-channel-chat',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    MatIconModule,
    DatePipe
  ],
  providers: [DatePipe], // DatePipe als Provider hinzufügen
  templateUrl: './channel-chat.component.html',
  styleUrls: ['./channel-chat.component.scss']
})
export class ChannelChatComponent implements OnInit, OnDestroy {
  messages: Message[] = [];
  groupedMessages: GroupedMessages[] = [];
  newMessageText: string = '';
  threadReplyText: string = '';
  senderName: string = '';
  senderAvatar: string = '/assets/img/dummy_pic.png';
  channelId: string = '';
  channelName: string = 'Entwicklerteam';
  channelMembers: ChannelMember[] = [];
  
  // Thread-Funktionalität
  activeThreadMessage: Message | null = null;
  showThread: boolean = false;
  threadReplies: ThreadReply[] = [];
  
  // Status-Flags
  isSending: boolean = false;
  isSendingReply: boolean = false;
  hasMessages: boolean = false;

  private routeSub!: Subscription;
  private messageSub!: Subscription;
  private threadSub!: Subscription;
  private userSub!: Subscription;

  constructor(
    private route: ActivatedRoute,
    private firestoreService: FirestoreService,
    private userService: UserDataService,
    private datePipe: DatePipe
  ) { }

  ngOnInit(): void {
    this.loadCurrentUser();
    
    this.routeSub = this.route.paramMap.subscribe(params => {
      const id = params.get('channelId');
      if (id) {
        this.channelId = id;
        this.channelName = id; 
        this.loadMessages();
        this.loadChannelMembers();
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

  loadChannelMembers(): void {
    // Mock-Daten für die Mitglieder
    this.channelMembers = [
      { name: 'Frederik Beck', avatar: '/assets/img/dummy_pic.png' },
      { name: 'Noah Braun', avatar: '/assets/img/dummy_pic.png' },
      { name: 'Sofia Müller', avatar: '/assets/img/dummy_pic.png' },
    ];
  }

  ngOnDestroy(): void {
    if (this.routeSub) this.routeSub.unsubscribe();
    if (this.messageSub) this.messageSub.unsubscribe();
    if (this.threadSub) this.threadSub.unsubscribe();
    if (this.userSub) this.userSub.unsubscribe();
  }

  loadMessages(): void {
    if (this.messageSub) {
      this.messageSub.unsubscribe();
    }
  
    if (!this.channelId) {
      console.error('Keine Channel-ID vorhanden!');
      return;
    }
  
    console.log(`Lade Nachrichten für Channel ${this.channelId}...`);
  
    this.messageSub = this.firestoreService.getChannelMessages(this.channelId)
      .subscribe({
        next: (response: any) => {
          console.log('Channel-Nachrichten erhalten:', response);
          const documents = response?.documents || [];
  
          if (documents.length === 0) {
            console.log(`Keine Nachrichten für Channel ${this.channelId} gefunden.`);
          }
  
          this.messages = documents.map((doc: any) => {
            return {
              id: doc.name.split('/').pop(),
              senderId: doc.fields.senderId.stringValue,
              text: doc.fields.text.stringValue,
              timestamp: new Date(doc.fields.timestamp.timestampValue),
              threadRepliesCount: doc.fields.threadRepliesCount?.integerValue 
                ? parseInt(doc.fields.threadRepliesCount.integerValue) : 0,
              avatar: doc.fields.avatar?.stringValue || this.getAvatarForUser(doc.fields.senderId.stringValue),
              reactions: doc.fields.reactions?.arrayValue?.values || []
            };
          }).sort((a: Message, b: Message) => a.timestamp.getTime() - b.timestamp.getTime());
  
          console.log(`${this.messages.length} Nachrichten für Channel ${this.channelId} geladen.`);
          this.hasMessages = this.messages.length > 0;
          this.groupMessagesByDate();
        },
        error: (error) => {
          console.error(`Fehler beim Laden der Nachrichten für Channel ${this.channelId}:`, error);
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
        // Format: Dienstag, 14 Januar
        dateLabel = this.datePipe.transform(date, 'EEEE, d MMMM', '', 'de') || '';
        // Erster Buchstabe groß
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

  getLastReplyTime(message: Message): string {
    return message.threadRepliesCount ? '14:56' : '';
  }

  getAvatarForUser(userId: string): string {
    const member = this.channelMembers.find(m => m.name === userId);
    if (member) {
      return member.avatar;
    }
    if (userId === this.senderName) {
      return this.senderAvatar;
    }
    return '/assets/img/dummy_pic.png';
  }

  async sendMessage(): Promise<void> {
    if (this.isSending || !this.newMessageText.trim()) return;

    this.isSending = true;

    const newMessage: Message = {
      text: this.newMessageText,
      senderId: this.senderName,
      timestamp: new Date(),
      avatar: this.senderAvatar
    };

    // Text zwischenspeichern und Feld leeren
    const messageText = this.newMessageText;
    this.newMessageText = '';
    
    try {
      // Lokale Nachricht anzeigen
      const tempId = Date.now().toString();
      this.messages.push({ ...newMessage, id: tempId });
      this.hasMessages = true;
      
      // Nachrichten nach Datum gruppieren
      this.groupMessagesByDate();
      
      // Server-Speicherung (hier simuliert)
      setTimeout(() => {
        console.log('Nachricht erfolgreich gesendet');
        this.isSending = false;
      }, 500);
    } catch (error) {
      console.error('Fehler beim Senden der Nachricht:', error);
      this.newMessageText = messageText;
      this.isSending = false;
    }
  }
  
  openThread(message: Message): void {
    this.activeThreadMessage = message;
    this.showThread = true;
    this.loadThreadReplies(message.id);
  }
  
  loadThreadReplies(messageId?: string): void {
    if (!messageId) return;
    
    // Beispiel-Thread-Antworten
    this.threadReplies = [
      {
        id: '2',
        senderId: 'Sofia Müller',
        text: 'Ich habe die gleiche Frage. Ich habe gegoogelt und es scheint, dass die aktuelle Version Angular 13 ist. Vielleicht weiß Frederik, ob es wahr ist.',
        timestamp: new Date('2023-01-14T14:30:00'),
        threadId: '1',
        avatar: '/assets/img/dummy_pic.png',
        reactions: []
      },
      {
        id: '3',
        senderId: 'Frederik Beck',
        text: 'Ja das ist es.',
        timestamp: new Date('2023-01-14T15:06:00'),
        threadId: '1',
        avatar: '/assets/img/dummy_pic.png',
        reactions: [{ emoji: '👍', count: 1, users: ['Sofia Müller'] }]
      }
    ];
  }
  
  closeThread(): void {
    this.activeThreadMessage = null;
    this.showThread = false;
    this.threadReplies = [];
  }
  
  async sendThreadReply(): Promise<void> {
    if (this.isSendingReply || !this.threadReplyText.trim() || !this.activeThreadMessage?.id) return;
    
    this.isSendingReply = true;
    
    const reply: ThreadReply = {
      id: Date.now().toString(),
      text: this.threadReplyText,
      senderId: this.senderName,
      timestamp: new Date(),
      threadId: this.activeThreadMessage.id,
      avatar: this.senderAvatar,
      reactions: []
    };
    
    // Text zwischenspeichern und Feld leeren
    const replyText = this.threadReplyText;
    this.threadReplyText = '';
    
    try {
      // Lokale Anzeige aktualisieren
      this.threadReplies.push(reply);
      
      // Server-Speicherung (hier simuliert)
      setTimeout(() => {
        if (this.activeThreadMessage) {
          this.activeThreadMessage.threadRepliesCount = (this.activeThreadMessage.threadRepliesCount || 0) + 1;
        }
        this.isSendingReply = false;
      }, 500);
    } catch (error) {
      console.error('Fehler beim Senden der Antwort:', error);
      this.threadReplyText = replyText;
      this.isSendingReply = false;
    }
  }
  
  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }
  
  onThreadKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendThreadReply();
    }
  }
}