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

interface Reaction {
  emoji: string;
  count: number;
  users: string[];
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
  providers: [DatePipe],
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
  
  activeThreadMessage: Message | null = null;
  showThread: boolean = false;
  threadReplies: ThreadReply[] = [];
  showReactionPicker: boolean = false;
  messageForReaction: Message | ThreadReply | null = null;
  
  isSending: boolean = false;
  isSendingReply: boolean = false;
  hasMessages: boolean = false;
  
  showChannelDescriptionModal = false;
  availableEmojis: string[] = ['👍', '❤️', '😂', '😮', '😢', '👏', '🎉', '🤔'];

  private routeSub!: Subscription;
  private messageSub!: Subscription;
  private threadSub!: Subscription;
  private userSub!: Subscription;
memberCount: any;
channelCreator: any;
channelDescription: any;

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
  
    if (!this.channelId) return;

    this.messageSub = this.firestoreService.getChannelMessages(this.channelId)
      .subscribe({
        next: (response: any) => {
          const documents = response?.documents || [];
  
          this.messages = documents.map((doc: any) => {
            return {
              id: doc.name.split('/').pop(),
              senderId: doc.fields.senderId.stringValue,
              text: doc.fields.text.stringValue,
              timestamp: new Date(doc.fields.timestamp.timestampValue),
              threadRepliesCount: doc.fields.threadRepliesCount?.integerValue 
                ? parseInt(doc.fields.threadRepliesCount.integerValue) : 0,
              avatar: doc.fields.avatar?.stringValue || this.getAvatarForUser(doc.fields.senderId.stringValue),
              reactions: this.parseReactions(doc.fields.reactions)
            };
          }).sort((a: Message, b: Message) => a.timestamp.getTime() - b.timestamp.getTime());
  
          this.hasMessages = this.messages.length > 0;
          
          if (!this.hasMessages) {
            this.addDemoMessage();
          }
          
          this.groupMessagesByDate();
        },
        error: (error) => { }
      });
  }
  
  parseReactions(reactionsField: any): Reaction[] {
    if (!reactionsField?.arrayValue?.values) return [];
    
    return reactionsField.arrayValue.values.map((r: any) => ({
      emoji: r.mapValue.fields.emoji.stringValue,
      count: parseInt(r.mapValue.fields.count.integerValue),
      users: r.mapValue.fields.users.arrayValue.values.map((u: any) => u.stringValue)
    }));
  }
  
  addDemoMessage(): void {
    this.messages = [
      {
        id: '1',
        senderId: 'Noah Braun',
        text: 'Welche Version ist aktuell von Angular?',
        timestamp: new Date('2023-01-14T14:25:00'),
        avatar: '/assets/img/dummy_pic.png',
        threadRepliesCount: 2,
        reactions: []
      }
    ];
    this.hasMessages = true;
  }

    closeChannelInfoModal() {
    this.showChannelDescriptionModal = false;
    
  }
  
  
  groupMessagesByDate(): void {
    const groupedObj: { [key: string]: GroupedMessages } = {};
    
    if (this.messages.length === 0) {
      this.groupedMessages = [];
      return;
    }
    
    for (const message of this.messages) {
      const date = new Date(message.timestamp);
      date.setHours(0, 0, 0, 0);
      
      const dateStr = date.toISOString();
      
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
        const options: Intl.DateTimeFormatOptions = { 
          weekday: 'long', 
          day: 'numeric', 
          month: 'long' 
        };
        dateLabel = date.toLocaleDateString('de-DE', options);
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
      avatar: this.senderAvatar,
      reactions: []
    };

    const messageText = this.newMessageText;
    this.newMessageText = '';
    
    try {
      const tempId = Date.now().toString();
      newMessage.id = tempId;
      this.messages.push(newMessage);
      this.hasMessages = true;
      this.groupMessagesByDate();
      
      await this.firestoreService.addMessageToChannel(this.channelId, newMessage);
    } catch (error) {
      this.newMessageText = messageText;
    } finally {
      this.isSending = false;
    }
  }
  
  openThread(message: Message): void {
    console.log('Thread öffnen für Nachricht:', message);
    this.activeThreadMessage = message;
    this.showThread = true;
    
    if (message.id) {
      this.loadThreadReplies(message.id);
    }
  }
  
  loadThreadReplies(messageId?: string): void {
    if (!messageId) return;
    
    if (this.threadSub) {
      this.threadSub.unsubscribe();
    }
    
    this.threadSub = this.firestoreService.getThreadMessages(messageId).subscribe({
      next: (response: any) => {
        const documents = response?.documents || [];
        
        this.threadReplies = documents.map((doc: any) => {
          return {
            id: doc.name.split('/').pop(),
            senderId: doc.fields.senderId.stringValue,
            text: doc.fields.text.stringValue,
            timestamp: new Date(doc.fields.timestamp.timestampValue),
            threadId: doc.fields.threadId.stringValue,
            avatar: doc.fields.avatar?.stringValue || this.getAvatarForUser(doc.fields.senderId.stringValue),
            reactions: this.parseReactions(doc.fields.reactions)
          };
        }).sort((a: ThreadReply, b: ThreadReply) => a.timestamp.getTime() - b.timestamp.getTime());
        
        if (this.threadReplies.length === 0) {
          this.addDemoThreadReplies(messageId);
        }
      },
      error: (error) => {}
    });
  }
  
  addDemoThreadReplies(messageId: string): void {
    this.threadReplies = [
      {
        id: '2',
        senderId: 'Sofia Müller',
        text: 'Ich habe die gleiche Frage. Ich habe gegoogelt und es scheint, dass die aktuelle Version Angular 13 ist. Vielleicht weiß Frederik, ob es wahr ist.',
        timestamp: new Date('2023-01-14T14:30:00'),
        threadId: messageId,
        avatar: '/assets/img/dummy_pic.png',
        reactions: []
      },
      {
        id: '3',
        senderId: 'Frederik Beck',
        text: 'Ja das ist es.',
        timestamp: new Date('2023-01-14T15:06:00'),
        threadId: messageId,
        avatar: '/assets/img/dummy_pic.png',
        reactions: [{ emoji: '👍', count: 1, users: ['Sofia Müller'] }]
      }
    ];
  }
  
  closeThread(): void {
    this.activeThreadMessage = null;
    this.showThread = false;
    this.threadReplies = [];
    if (this.threadSub) {
      this.threadSub.unsubscribe();
    }
  }
  
  openReactionPicker(message: Message | ThreadReply): void {
    this.messageForReaction = message;
    this.showReactionPicker = true;
  }
  
  closeReactionPicker(): void {
    this.showReactionPicker = false;
    this.messageForReaction = null;
  }
  
  addReaction(emoji: string): void {
    if (!this.messageForReaction || !this.messageForReaction.id) return;
    
    const message = this.messageForReaction;
    this.closeReactionPicker();
    
    if (!message.reactions) {
      message.reactions = [];
    }
    
    const existingReaction = message.reactions.find(r => r.emoji === emoji);
    
    if (existingReaction) {
      if (existingReaction.users.includes(this.senderName)) {
        existingReaction.users = existingReaction.users.filter(user => user !== this.senderName);
        existingReaction.count--;
        
        if (existingReaction.count <= 0) {
          message.reactions = message.reactions.filter(r => r.emoji !== emoji);
        }
      } else {
        existingReaction.users.push(this.senderName);
        existingReaction.count++;
      }
    } else {
      message.reactions.push({
        emoji: emoji,
        count: 1,
        users: [this.senderName]
      });
    }
    
    this.updateReactions(message);
  }
  
  updateReactions(message: Message | ThreadReply): void {
    if (!message.id) return;
    
    if ('threadId' in message && message.threadId) {
      this.firestoreService.updateThreadReply(message.threadId, message.id, { reactions: message.reactions });
    } else {
      this.firestoreService.updateChannelMessage(this.channelId, message.id, { reactions: message.reactions });
    }
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
    
    const replyText = this.threadReplyText;
    this.threadReplyText = '';
    
    try {
      this.threadReplies.push(reply);
      
      await this.firestoreService.addReplyToThread(this.activeThreadMessage.id, reply);
      
      if (this.activeThreadMessage) {
        this.activeThreadMessage.threadRepliesCount = (this.activeThreadMessage.threadRepliesCount || 0) + 1;
        await this.firestoreService.updateThreadRepliesCount(this.activeThreadMessage.id);
      }
    } catch (error) {
      this.threadReplyText = replyText;
      this.threadReplies = this.threadReplies.filter(r => r.id !== reply.id);
    } finally {
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