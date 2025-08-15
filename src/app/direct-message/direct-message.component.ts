import { Component, OnInit, OnDestroy, ViewChild, ViewChildren, ElementRef, AfterViewChecked, HostListener, ChangeDetectorRef, QueryList } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { FirestoreService } from '../services/firestore.service';
import { ActivatedRoute } from '@angular/router';
import { ChatNavigationService } from '../services/chat-navigation.service';
import { AvatarService } from '../services/avatar.service';
import { Subscription } from 'rxjs';
import { UserDataService, UserProfile } from '../services/user_data.service';
import { ChatPartnerService } from '../services/chat-partner.service';
import { PickerComponent } from '@ctrl/ngx-emoji-mart';
import { ReactionToolsComponent } from '../reaction-tools/reaction-tools.component';
import { ReactionBubbleComponent } from '../reaction-bubble/reaction-bubble.component';

interface Message {
  id?: string;
  senderId: string;
  text: string;
  timestamp: Date;
  avatar?: string;
  reactions: Reaction[];
}

interface Reaction {
  emoji: string;
  count: number;
  users: string[];
}

interface GroupedMessages {
  date: Date;
  dateLabel: string;
  messages: Message[];
}

@Component({
  selector: 'app-direct-message',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    PickerComponent,
    ReactionToolsComponent,
    ReactionBubbleComponent
  ],
  templateUrl: './direct-message.component.html',
  styleUrls: ['./direct-message.component.scss']
})
export class DirectMessageComponent implements OnInit, OnDestroy, AfterViewChecked {
  messages: Message[] = [];
  groupedMessages: GroupedMessages[] = [];
  newMessageText: string = '';
  pickerTopAligned: { [key: string]: boolean } = {};
  senderName: string = 'Frederik Beck';
  senderAvatar: string = '/assets/img/dummy_pic.png';
  chatId: string = '';
  partnerName: string = 'Lara Lindt';
  partnerAvatarUrl: string = '/assets/img/dummy_pic.png';
  isSending: boolean = false;
  hoveredMessageId: string | null = null;
  editingMessageId: string | null = null;
  editingMessageText: string = '';
  showEmojiPickerForMessage: string | null = null;
  showEmojiPickerForReaction: string | null = null;
  showEmojiPickerForInput: boolean = false;
  expandedReactions: { [key: string]: boolean } = {};
  readonly MAX_DESKTOP_REACTIONS = 20;
  readonly MAX_MOBILE_REACTIONS = 7;
  isMobile = false;
  closePickerOnOutsideClick: any;
  emojiCategories: string[] = ['people', 'nature', 'foods', 'activity', 'objects', 'symbols', 'places', 'flags'];

  @ViewChild('messagesContainer') private messagesContainer!: ElementRef;
  @ViewChild('emojiPicker') private emojiPicker!: ElementRef;
  @ViewChildren('reactionPicker') reactionPickers!: QueryList<ElementRef<HTMLElement>>;
  private pickerAnchors: Record<string, HTMLElement> = {};
  private needsToScroll = false;

  private routeSub!: Subscription;
  private querySub!: Subscription;
  private messageSub!: Subscription;
  private userSub!: Subscription;
  private refreshReactionsDisplay(): void {
    this.expandedReactions = {};
  }

  constructor(
    private firestore: FirestoreService,
    private route: ActivatedRoute,
    private chatNavigationService: ChatNavigationService,
    private avatarService: AvatarService,
    private userService: UserDataService,
    private chatPartnerService: ChatPartnerService,
    private cdr: ChangeDetectorRef,
    private chatNav: ChatNavigationService
  ) { }

  @HostListener('touchstart', ['$event'])
onTouchStart(event: TouchEvent) {
  if (this.isMobile) {
    const target = event.target as HTMLElement;
    if (!target.closest('.add-reaction-button') && !target.closest('.emoji-picker-container')) {
      this.showEmojiPickerForMessage = null;
      this.showEmojiPickerForReaction = null;
      this.showEmojiPickerForInput = false;
    }
  }
}

  @HostListener('window:resize')
onResizeReposition() {
  if (this.showEmojiPickerForReaction) {
    this.positionReactionPicker(this.showEmojiPickerForReaction);
  }
}

@HostListener('window:scroll')
onScrollReposition() {
  if (this.showEmojiPickerForReaction) {
    this.positionReactionPicker(this.showEmojiPickerForReaction);
  }
}

  ngOnInit(): void {
    this.loadCurrentUser();
    this.checkScreenSize();

    window.addEventListener('resize', () => {
      this.checkScreenSize();
    });

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
    this.userSub = this.userService.user$.subscribe((user: UserProfile | null | undefined) => {
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

    this.messageSub = this.firestore.getChatMessages(this.chatId).subscribe({
      next: (response: any) => {
        const documents = response?.documents || [];

        this.messages = documents.map((doc: any) => {
          const fields = doc.fields || {};

          const senderId = fields.senderId?.stringValue || 'Unbekannt';
          const text = fields.text?.stringValue || '';
          const timestampStr = fields.timestamp?.timestampValue;
          const timestamp = timestampStr ? new Date(timestampStr) : new Date();
          const avatar = fields.avatar?.stringValue || this.getAvatarForUser(senderId);

          const rawReactions = fields.reactions?.arrayValue?.values || [];
          const reactions = rawReactions.map((r: any): Reaction => {
            const reactionFields = r?.mapValue?.fields || {};
            const emoji = reactionFields.emoji?.stringValue || '';
            const count = parseInt(reactionFields.count?.integerValue || '0', 10);
            const users = reactionFields.users?.arrayValue?.values?.map((u: any) => u?.stringValue) || [];
            return { emoji, count, users };
          });

          return {
            id: doc.name.split('/').pop(),
            senderId,
            text,
            timestamp,
            avatar,
            reactions
          };
        }).sort((a: { timestamp: { getTime: () => number; }; }, b: { timestamp: { getTime: () => number; }; }) => a.timestamp.getTime() - b.timestamp.getTime());

        this.groupMessagesByDate();
        this.refreshReactionsDisplay();

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

  onMessageHover(messageId: string): void {
    this.hoveredMessageId = messageId;
  }

  onMessageLeave(): void {
    this.hoveredMessageId = null;
  }

  isOwnMessage(message: Message): boolean {
    return message.senderId === this.senderName;
  }

  openProfileView(userName: string, avatarUrl: string): void {
    console.log('Opening profile view for:', userName);
  }

  startEditing(messageId: string, messageText: string): void {
    this.editingMessageId = messageId;
    this.editingMessageText = messageText;
  }

  cancelEditing(): void {
    this.editingMessageId = null;
    this.editingMessageText = '';
  }

  async saveEditedMessage(messageId: string): Promise<void> {
    if (!this.editingMessageText.trim()) return;

    try {
      await this.firestore.updateMessageText(this.chatId, messageId, this.editingMessageText);

      const messageIndex = this.messages.findIndex(m => m.id === messageId);
      if (messageIndex !== -1) {
        this.messages[messageIndex].text = this.editingMessageText;
        this.groupMessagesByDate();
      }

      this.cancelEditing();
    } catch (error) {
      console.error('Fehler beim Aktualisieren der Nachricht:', error);
    }
  }

  toggleEmojiPickerForMessage(messageId: string): void {
    this.showEmojiPickerForMessage = this.showEmojiPickerForMessage === messageId ? null : messageId;
    this.showEmojiPickerForReaction = null;
    this.showEmojiPickerForInput = false;
  }

  toggleEmojiPickerForReaction(messageId: string, event: Event): void {
    event.stopPropagation();
    this.showEmojiPickerForReaction = this.showEmojiPickerForReaction === messageId ? null : messageId;
    this.showEmojiPickerForMessage = null;
    this.showEmojiPickerForInput = false;
  }

  toggleEmojiPickerForInput(): void {
    this.showEmojiPickerForInput = !this.showEmojiPickerForInput;
    this.showEmojiPickerForMessage = null;
    this.showEmojiPickerForReaction = null;
  }

  addEmojiToMessage(event: any): void {
    if (this.editingMessageId) {
      this.editingMessageText += event.emoji.native;
    }
  }

  addEmojiToInput(event: any): void {
    this.newMessageText += event.emoji.native;
  }

  async addReaction(messageId: string, event: any): Promise<void> {
    try {
      const emoji = event.emoji.native;

      const messageIndex = this.messages.findIndex(m => m.id === messageId);
      if (messageIndex === -1) return;

      const message = this.messages[messageIndex];

      const reactionIndex = message.reactions.findIndex(r => r.emoji === emoji);

      if (reactionIndex !== -1) {
        const reaction = message.reactions[reactionIndex];
        const userIndex = reaction.users.indexOf(this.senderName);

        if (userIndex !== -1) {
          reaction.users.splice(userIndex, 1);
          reaction.count--;

          if (reaction.count === 0) {
            message.reactions.splice(reactionIndex, 1);
          }
        } else {
          reaction.users.push(this.senderName);
          reaction.count++;
        }
      } else {
        message.reactions.push({
          emoji,
          count: 1,
          users: [this.senderName]
        });
      }
      await this.firestore.updateMessageReactions(this.chatId, messageId, message.reactions);

      this.showEmojiPickerForReaction = null;
    } catch (error) {
      console.error('Fehler beim Hinzufügen der Reaktion:', error);
    }
  }

  checkScreenSize(): void {
    this.isMobile = window.innerWidth <= 768;
  }

  getVisibleReactions(message: Message): Reaction[] {
    if (!message.reactions || message.reactions.length === 0) return [];

    const maxVisible = this.isMobile ? this.MAX_MOBILE_REACTIONS : this.MAX_DESKTOP_REACTIONS;

    if (this.expandedReactions[message.id!] || message.reactions.length <= maxVisible) {
      return message.reactions;
    }

    return message.reactions.slice(0, maxVisible);
  }

  getHiddenReactionsCount(message: Message): number {
    if (!message.reactions || message.reactions.length === 0) return 0;

    const maxVisible = this.isMobile ? this.MAX_MOBILE_REACTIONS : this.MAX_DESKTOP_REACTIONS;

    if (this.expandedReactions[message.id!] || message.reactions.length <= maxVisible) {
      return 0;
    }

    return message.reactions.length - maxVisible;
  }

  toggleReactionsExpansion(messageId: string): void {
    this.expandedReactions[messageId] = !this.expandedReactions[messageId];
  }

  toggleReactionPicker(messageId: string, anchorEl: HTMLElement, evt: MouseEvent) {
    evt.stopPropagation();
    if (this.showEmojiPickerForReaction === messageId) {
      this.showEmojiPickerForReaction = null;
      return;
    }
    this.showEmojiPickerForReaction = messageId;
    this.showEmojiPickerForMessage = null;
    this.showEmojiPickerForInput = false;
    this.pickerAnchors[messageId] = anchorEl;
  
    setTimeout(() => {
      this.positionReactionPicker(messageId);
      this.activateFirstCategory();
    }, 0);
  }
  
  
  @HostListener('document:click')
  closePickersOnOutsideClickDoc() {
    if (this.showEmojiPickerForReaction) {
      this.showEmojiPickerForReaction = null;
    }
  }
  
  private positionReactionPicker(messageId: string) {
    const anchorEl = this.pickerAnchors[messageId];
    const pickerEl = this.reactionPickers.first?.nativeElement;
    if (!anchorEl || !pickerEl) return;
  
    const a = anchorEl.getBoundingClientRect();
  
    const pickerW = pickerEl.offsetWidth  || 320;
    const pickerH = pickerEl.offsetHeight || 320;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const GAP = 8;
  
    let left = a.left + (a.width / 2) - (pickerW / 2);
    left = Math.max(GAP, Math.min(left, vw - pickerW - GAP));
  
    let top = a.top - pickerH - GAP;
    if (top < GAP && (vh - a.bottom) > (pickerH + GAP)) {
      top = a.bottom + GAP;
    }
  
    pickerEl.style.position = 'fixed';
    pickerEl.style.left = `${Math.round(left)}px`;
    pickerEl.style.top  = `${Math.round(top)}px`;
  }
  

  showReactionPicker(messageId: string) {
    this.showEmojiPickerForReaction = messageId;
    this.showEmojiPickerForInput = false;
    this.showEmojiPickerForMessage = null;

    setTimeout(() => {
      document.addEventListener('click', this.closePickerOnOutsideClick = (event: any) => {
        const picker = document.querySelector('.emoji-picker-for-reaction');
        if (picker && !picker.contains(event.target) &&
          !event.target.closest('.add-reaction-button')) {
          this.showEmojiPickerForReaction = null;
          document.removeEventListener('click', this.closePickerOnOutsideClick);
          this.cdr.detectChanges();
        }
      });
    }, 0);
  }

  private activateFirstCategory(): void {
    const pickerEl = this.reactionPickers.first?.nativeElement;
    if (!pickerEl) return;
    const firstAnchor = pickerEl.querySelector('.emoji-mart-anchor') as HTMLElement | null;
    firstAnchor?.click();
  }

  goToDM(userName: string) {
    this.chatNav.openDirectMessageWith(userName);
  }
}