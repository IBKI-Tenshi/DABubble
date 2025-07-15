import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
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
import { ChatPartnerService } from '../services/chat-partner.service';

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
export class DirectMessageComponent implements OnInit, OnDestroy, AfterViewChecked {
  messages: Message[] = [];
  groupedMessages: GroupedMessages[] = [];
  newMessageText: string = '';
  senderName: string = 'Frederik Beck';
  senderAvatar: string = '/assets/img/dummy_pic.png';
  chatId: string = '';
  partnerName: string = 'Lara Lindt';
  partnerAvatarUrl: string = '/assets/img/dummy_pic.png';
  isSending: boolean = false;

  @ViewChild('messagesContainer') private messagesContainer!: ElementRef;
  private needsToScroll = false;

  private routeSub!: Subscription;
  private querySub!: Subscription;
  private messageSub!: Subscription;
  private userSub!: Subscription;

  constructor(
    private firestore: FirestoreService,
    private route: ActivatedRoute,
    private chatNavigationService: ChatNavigationService,
    private avatarService: AvatarService,
    private userService: UserDataService,
    private chatPartnerService: ChatPartnerService 
  ) { }

  ngOnInit(): void {
    this.loadCurrentUser();
  
    this.routeSub = this.route.paramMap.subscribe(params => {
      const id = params.get('chatId');
      if (id) {
        this.chatId = id;
        
        const partner = this.chatPartnerService.getChatPartner(id);
        if (partner) {
          this.partnerName = partner.name;
          this.partnerAvatarUrl = partner.avatar;
        }
        
        this.loadChatInfo();
        this.loadMessages();
      } else {
        console.error('Keine Chat-ID in den Route-Parametern gefunden!');
      }
    });
    
    this.querySub = this.route.queryParams.subscribe(params => {
      if (params['name'] && params['avatar']) {
        this.partnerName = params['name'];
        this.partnerAvatarUrl = params['avatar'];
        
        if (this.chatId) {
          this.chatPartnerService.setChatPartner(this.chatId, params['name'], params['avatar']);
        }
      }
    });
  }

  ngAfterViewChecked() {
    if (this.needsToScroll && this.messagesContainer) {
      this.scrollToBottom();
      this.needsToScroll = false; 
    }
  }

  scrollToBottom(): void {
    try {
      const element = this.messagesContainer.nativeElement;
      element.scrollTop = element.scrollHeight;
    } catch (err) {
      console.error('Fehler beim Scrollen:', err);
    }
  }

  loadChatInfo(): void {
    this.firestore.getChatById(this.chatId).subscribe({
      next: (chatData: any) => {
        if (chatData && chatData.fields) {
          const participants = chatData.fields.participants?.arrayValue?.values || [];
          const participantNames = chatData.fields.participantNames?.arrayValue?.values || [];
          
          if (participants.length === 2 && participantNames.length === 2) {
            const currentUserName = this.senderName;
            const partnerNameObj = participantNames.find((p: any) => 
              p.stringValue !== currentUserName
            );

            if (partnerNameObj) {
              this.partnerName = partnerNameObj.stringValue;
              this.chatPartnerService.setChatPartner(
                this.chatId, 
                this.partnerName, 
                this.partnerAvatarUrl
              );
            }
          }
        }
      },
      error: (error) => {
        console.error('Fehler beim Laden der Chat-Informationen:', error);
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

    this.messageSub = this.firestore.getChatMessages(this.chatId)
      .subscribe({
        next: (response: any) => {
          const documents = response?.documents || [];

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

          this.groupMessagesByDate();
          
          if (documents.length > 0) {
            this.needsToScroll = true;
          }
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
      const tempId = Date.now().toString();
      const tempMessage = { ...newMessage, id: tempId };
      
      this.messages.push(tempMessage);
      this.groupMessagesByDate();
      
      this.needsToScroll = true;
      
      await this.firestore.addMessageToChat(this.chatId, newMessage);
    } catch (error) {
      console.error('Fehler beim Senden der Nachricht:', error);
      
      this.newMessageText = messageText;
      
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