import {
  Component,
  OnInit,
  OnDestroy,
  ViewChild,
  ViewChildren,
  ElementRef,
  AfterViewChecked,
  HostListener,
  ChangeDetectorRef,
  QueryList,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute } from '@angular/router';
import { combineLatest, filter, Subscription, tap } from 'rxjs';
import { FirestoreService } from '../services/firestore.service';
import { ChatNavigationService } from '../services/chat-navigation.service';
import { AvatarService } from '../services/avatar.service';
import { UserDataService, UserProfile } from '../services/user_data.service';
import { ChatPartnerService } from '../services/chat-partner.service';
import { PickerComponent } from '@ctrl/ngx-emoji-mart';
import { ReactionToolsComponent } from '../reaction-tools/reaction-tools.component';
import { ReactionBubbleComponent } from '../reaction-bubble/reaction-bubble.component';

interface Message {
  id?: string;
  senderId: string;
  senderName?: string;
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
    ReactionBubbleComponent,
  ],
  templateUrl: './direct-message.component.html',
  styleUrls: ['./direct-message.component.scss'],
})
export class DirectMessageComponent
  implements OnInit, OnDestroy, AfterViewChecked
{
  messages: Message[] = [];
  groupedMessages: GroupedMessages[] = [];
  newMessageText: string = '';
  pickerTopAligned: { [key: string]: boolean } = {};
  senderName: string = 'Frederik Beck';
  senderAvatar: string = '/assets/img/dummy_pic.png';
  chatId: string = '';
  partnerName: string = '';
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

  emojiCategories: string[] = [
    'people',
    'nature',
    'foods',
    'activity',
    'objects',
    'symbols',
    'places',
    'flags',
  ];

  @ViewChild('messagesContainer') private messagesContainer!: ElementRef;
  @ViewChild('emojiPicker') private emojiPicker!: ElementRef;
  @ViewChildren('reactionPicker') reactionPickers!: QueryList<
    ElementRef<HTMLElement>
  >;

  private pickerAnchors: Record<string, HTMLElement> = {};
  private _resizeTimeout: any;
  private _scrollTimeout: any;
  private needsToScroll = false;
  public reactionPickerPos: Record<string, { left: number; top: number }> = {};
  private routeSub!: Subscription;
  private querySub!: Subscription;
  private messageSub!: Subscription;
  private userSub!: Subscription;
  private readySub!: Subscription;

  constructor(
    private firestore: FirestoreService,
    private route: ActivatedRoute,
    private chatNavigationService: ChatNavigationService,
    private avatarService: AvatarService,
    private userService: UserDataService,
    private chatPartnerService: ChatPartnerService,
    private cdr: ChangeDetectorRef,
  ) {}

  @HostListener('touchstart', ['$event'])
  onTouchStart(event: TouchEvent) {
    if (this.isMobile) {
      const target = event.target as HTMLElement;
      if (
        !target.closest('.add-reaction-button') &&
        !target.closest('.emoji-picker-container')
      ) {
        this.showEmojiPickerForMessage = null;
        this.showEmojiPickerForReaction = null;
        this.showEmojiPickerForInput = false;
      }
    }
  }

  @HostListener('window:resize')
  onResizeReposition() {
    if (this._resizeTimeout) clearTimeout(this._resizeTimeout);
    this._resizeTimeout = setTimeout(() => {
      if (this.showEmojiPickerForReaction) {
        this.positionReactionPicker(this.showEmojiPickerForReaction);
      }
      this.checkScreenSize();
    }, 100);
  }

  @HostListener('window:scroll')
  onScrollReposition() {
    if (this._scrollTimeout) clearTimeout(this._scrollTimeout);
    this._scrollTimeout = setTimeout(() => {
      if (this.showEmojiPickerForReaction) {
        this.positionReactionPicker(this.showEmojiPickerForReaction);
      }
    }, 100);
  }

  ngOnInit(): void {
    this.checkScreenSize();
    window.addEventListener('resize', () => this.checkScreenSize());

    this.readySub = combineLatest([this.userService.user$, this.route.paramMap])
      .pipe(
        filter(([u, p]) => !!u && !!p.get('chatId')),
        tap(() => {
          this.messages = [];
          this.groupedMessages = [];
          this.hoveredMessageId = null;
          this.editingMessageId = null;
          this.showEmojiPickerForInput = false;
          this.showEmojiPickerForMessage = null;
          this.showEmojiPickerForReaction = null;
        })
      )
      .subscribe(([user, params]) => {
        this.senderName = user!.name || this.senderName;
        this.senderAvatar = user!.profileImage || this.senderAvatar;
        this.chatId = params.get('chatId')!;

        const cached = this.chatPartnerService.getChatPartner(this.chatId);
        if (cached) {
          this.partnerName = cached.name;
          this.partnerAvatarUrl = cached.avatar;
        }

        this.loadChatInfo();
        this.loadMessages();
      });

    this.querySub = this.route.queryParams.subscribe((params) => {
      if (params['name']) this.partnerName = params['name'];
      if (params['avatar']) this.partnerAvatarUrl = params['avatar'];
      if (this.chatId && (params['name'] || params['avatar'])) {
        this.chatPartnerService.setChatPartner(
          this.chatId,
          this.partnerName,
          this.partnerAvatarUrl
        );
      }
    });
  }

  ngAfterViewChecked() {
    if (this.needsToScroll && this.messagesContainer) {
      this.scrollToBottom();
      this.needsToScroll = false;
    }
  }

  ngOnDestroy(): void {
    this.readySub?.unsubscribe();
    this.routeSub?.unsubscribe();
    this.querySub?.unsubscribe();
    this.messageSub?.unsubscribe();
    this.userSub?.unsubscribe();
  }

  private refreshReactionsDisplay(): void {
    this.expandedReactions = {};
  }

  private compareMessages = (a: Message, b: Message) => {
    const diff = a.timestamp.getTime() - b.timestamp.getTime();
    if (diff !== 0) return diff;
    return (a.id || '').localeCompare(b.id || '');
  };

  scrollToBottom(): void {
    try {
      const element = this.messagesContainer.nativeElement;
      element.scrollTop = element.scrollHeight;
    } catch (err) {
      console.error('Fehler beim Scrollen:', err);
    }
  }

  checkScreenSize(): void {
    this.isMobile = window.innerWidth <= 768;
  }

  getAvatarForUser(userId: string): string {
    if (userId === this.senderName) {
      return this.senderAvatar;
    }
    return this.partnerAvatarUrl;
  }

  loadChatInfo(): void {
    if (!this.chatId) return;

    this.firestore.getChatById(this.chatId).subscribe({
      next: (chatData: any) => {
        const f = chatData?.fields;
        if (!f) return;

        const names: string[] =
          f.participantNames?.arrayValue?.values
            ?.map((v: any) => v?.stringValue)
            .filter(Boolean) || [];
        let partner = names.find((n) => (n === this.senderName ? false : true));
        if (!partner) partner = this.senderName;

        if (!partner || partner === 'Unbekannt') partner = this.senderName;

        this.partnerName = partner;

        const cached = this.chatPartnerService.getChatPartner(this.chatId);
        if (cached?.avatar) {
          this.partnerAvatarUrl = cached.avatar;
        } else if (partner === this.senderName) {
          this.partnerAvatarUrl = this.senderAvatar;
        } else {
          this.partnerAvatarUrl ||= '/assets/img/dummy_pic.png';
        }
        this.chatPartnerService.setChatPartner(
          this.chatId,
          this.partnerName,
          this.partnerAvatarUrl
        );
      },
      error: async (error) => {
        console.error('Fehler beim Laden der Chat-Informationen:', error);
        if (error?.status === 404) {
          await this.firestore.ensureChatDoc(this.chatId, {
            fields: {
              participantNames: {
                arrayValue: {
                  values: [this.senderName].map((n) => ({ stringValue: n })),
                },
              },
              createdAt: { timestampValue: new Date().toISOString() },
            },
          });
          this.loadChatInfo();
        }
      },
    });
  }

  loadCurrentUser(): void {
    this.userSub = this.userService.user$.subscribe(
      (user: UserProfile | null | undefined) => {
        if (user) {
          const prev = this.senderName;
          this.senderName = user.name || 'Frederik Beck';
          this.senderAvatar = user.profileImage || '/assets/img/dummy_pic.png';
          if (this.chatId && prev !== this.senderName) {
            this.loadChatInfo();
          }
        }
      }
    );
  }

  loadMessages(): void {
    this.messageSub?.unsubscribe();
  
    if (!this.chatId) {
      console.error('Keine Chat-ID vorhanden!');
      return;
    }
  
    this.messageSub = this.firestore.getChatMessages(this.chatId).subscribe({
      next: (response: any) => {
        const documents = response?.documents || [];
  
        this.messages = documents
          .map((doc: any) => {
            const fields = doc.fields || {};
            const id = doc.name.split('/').pop();
            const tsRaw =
              fields.timestamp?.timestampValue ||
              doc.createTime ||
              doc.updateTime ||
              null;
  
            const timestamp = tsRaw ? new Date(tsRaw) : new Date(0);
  
            const originalSenderId = fields.originalSenderId?.stringValue || fields.senderId?.stringValue || '';
            
            const text = fields.text?.stringValue || '';
            const avatar = fields.avatar?.stringValue || this.getAvatarForUser(originalSenderId);

            const rawReactions = fields.reactions?.arrayValue?.values || [];
            const reactions = rawReactions.map((r: any): Reaction => {
              const f = r?.mapValue?.fields || {};
              return {
                emoji: f.emoji?.stringValue || '',
                count: parseInt(f.count?.integerValue || '0', 10),
                users:
                  f.users?.arrayValue?.values?.map(
                    (u: any) => u?.stringValue
                  ) || [],
              };
            });
  
            return {
              id,
              senderId: originalSenderId,
              text,
              timestamp,
              avatar,
              reactions,
            } as Message;
          })
          .sort(this.compareMessages);
  
        this.groupMessagesByDate();
        this.refreshReactionsDisplay();
  
        if (documents.length > 0) {
          this.needsToScroll = true;
        }
      },
      error: (error) =>
        console.error(
          `Fehler beim Laden der Nachrichten für Chat ${this.chatId}:`,
          error
        ),
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
          month: 'long',
        };
        dateLabel = date.toLocaleDateString('de-DE', options);
        dateLabel = dateLabel.charAt(0).toUpperCase() + dateLabel.slice(1);
      }

      if (!groupedObj[dateStr]) {
        groupedObj[dateStr] = { date, dateLabel, messages: [] };
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
      reactions: [],
    };
  
    const messageText = this.newMessageText;
    this.newMessageText = '';
  
    try {
      const tempId = Date.now().toString();
      const tempMessage = { ...newMessage, id: tempId };
  
      this.messages.push(tempMessage);
      this.messages.sort(this.compareMessages);
      this.groupMessagesByDate();
  
      this.needsToScroll = true;
  
      await this.firestore.addMessageToChat(this.chatId, {
        ...newMessage,
        originalSenderId: this.senderName
      });
    } catch (error) {
      console.error('Fehler beim Senden der Nachricht:', error);
      this.newMessageText = messageText;
      alert(
        'Nachricht konnte nicht gesendet werden. Bitte versuche es erneut.'
      );
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
      await this.firestore.updateMessageText(
        this.chatId,
        messageId,
        this.editingMessageText
      );

      const messageIndex = this.messages.findIndex((m) => m.id === messageId);
      if (messageIndex !== -1) {
        this.messages[messageIndex].text = this.editingMessageText;
        this.groupMessagesByDate();
      }

      this.cancelEditing();
    } catch (error) {
      console.error('Fehler beim Aktualisieren der Nachricht:', error);
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

  toggleEmojiPickerForMessage(messageId: string): void {
    this.showEmojiPickerForMessage =
      this.showEmojiPickerForMessage === messageId ? null : messageId;
    this.showEmojiPickerForReaction = null;
    this.showEmojiPickerForInput = false;
  }

  toggleEmojiPickerForReaction(messageId: string, event: Event): void {
    event.stopPropagation();
    this.showEmojiPickerForReaction =
      this.showEmojiPickerForReaction === messageId ? null : messageId;
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

      const messageIndex = this.messages.findIndex((m) => m.id === messageId);
      if (messageIndex === -1) return;
      const message = this.messages[messageIndex];
      const reactionIndex = message.reactions.findIndex(
        (r) => r.emoji === emoji
      );
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
          users: [this.senderName],
        });
      }
  
      await this.firestore.updateMessageReactionsAndSender(
        this.chatId,
        messageId,
        message.reactions,
        message.senderId 
      );
      
      this.showEmojiPickerForReaction = null;
    } catch (error) {
      console.error('Fehler beim Hinzufügen der Reaktion:', error);
    }
  }

  getVisibleReactions(message: Message): Reaction[] {
    if (!message.reactions || message.reactions.length === 0) return [];
    const maxVisible = this.isMobile
      ? this.MAX_MOBILE_REACTIONS
      : this.MAX_DESKTOP_REACTIONS;
    if (
      this.expandedReactions[message.id!] ||
      message.reactions.length <= maxVisible
    ) {
      return message.reactions;
    }
    return message.reactions.slice(0, maxVisible);
  }

  getHiddenReactionsCount(message: Message): number {
    if (!message.reactions || message.reactions.length === 0) return 0;
    const maxVisible = this.isMobile
      ? this.MAX_MOBILE_REACTIONS
      : this.MAX_DESKTOP_REACTIONS;
    if (
      this.expandedReactions[message.id!] ||
      message.reactions.length <= maxVisible
    ) {
      return 0;
    }
    return message.reactions.length - maxVisible;
  }

  toggleReactionsExpansion(messageId: string): void {
    this.expandedReactions[messageId] = !this.expandedReactions[messageId];
  }

  toggleReactionPicker(
    messageId: string,
    anchorEl: HTMLElement,
    evt: MouseEvent
  ) {
    evt.stopPropagation();

    if (this.showEmojiPickerForReaction === messageId) {
      this.showEmojiPickerForReaction = null;
      return;
    }

    this.showEmojiPickerForMessage = null;
    this.showEmojiPickerForInput = false;

    this.pickerAnchors[messageId] = anchorEl;
    this.positionReactionPicker(messageId);
    this.showEmojiPickerForReaction = messageId;
  }

  @HostListener('document:click', ['$event'])
  closePickersOnOutsideClickDoc(event: MouseEvent) {
    const clickTarget = event.target as HTMLElement;
    if (this.showEmojiPickerForReaction &&
        !clickTarget.closest('.emoji-picker-container') &&
        !clickTarget.closest('.add-reaction-button')) {
      this.showEmojiPickerForReaction = null;
    }
  }

  private positionReactionPicker(messageId: string) {
    const anchorEl = this.pickerAnchors[messageId];
    if (!anchorEl) return;

    const a = anchorEl.getBoundingClientRect();
    const pickerW = 320;
    const pickerH = 320;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const GAP = 8;

    let left = a.left + a.width / 2 - pickerW / 2;
    left = Math.max(GAP, Math.min(left, vw - pickerW - GAP));

    let top = a.top - pickerH - GAP;
    if (top < GAP && vh - a.bottom > pickerH + GAP) {
      top = a.bottom + GAP;
    }

    this.reactionPickerPos[messageId] = {
      left: Math.round(left),
      top: Math.round(top),
    };
    this.cdr.detectChanges();
  }

  openProfileView(userName: string, avatarUrl: string): void {
    console.log('Opening profile view for:', userName);
  }

  goToDM(userName: string) {
    if (!userName) return;
    this.chatNavigationService.openDirectMessageWith(userName);
  }
}
