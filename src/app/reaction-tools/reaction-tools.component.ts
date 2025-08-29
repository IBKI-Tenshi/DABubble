import {
  Component, Input, Output, EventEmitter, HostListener,
  ElementRef, ViewChild, Renderer2, AfterViewInit
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { PickerComponent } from '@ctrl/ngx-emoji-mart';
import { ChatNavigationService } from '../services/chat-navigation.service';
import { Router } from '@angular/router';
import { UserDataService } from '../services/user_data.service';
import { firstValueFrom } from 'rxjs'; 

@Component({
  selector: 'app-reaction-tools',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, PickerComponent],
  templateUrl: './reaction-tools.component.html',
  styleUrls: ['./reaction-tools.component.scss']
})
export class ReactionToolsComponent implements AfterViewInit {
  @Input() isOwn = false;
  @Input() messageId = '';
  @Input() messageText = '';
  @Input() senderId = '';

  @Output() onEdit = new EventEmitter<{ messageId: string; messageText: string }>();
  @Output() onReaction = new EventEmitter<any>();
  @Output() onDm = new EventEmitter<void>();
  @ViewChild('emojiPicker') emojiPickerRef?: ElementRef;

  showPicker = false;
  showMenu = false;
  shouldShowPickerOnTop = false;

  emojiCategories: string[] = [
    'people', 'nature', 'foods', 'activity', 'objects', 'symbols', 'places', 'flags'
  ];

  constructor(
    private renderer: Renderer2,
    private elementRef: ElementRef,
    private chatNavigationService: ChatNavigationService,
    private router: Router,
    private userDataService: UserDataService
  ) { }

  ngAfterViewInit() {
    setTimeout(() => this.fixEmojiPicker(), 100);
  }

  async openDm() {
    if (!this.messageId || !this.senderId) {
      console.error('Kann DM nicht öffnen: Keine Message-ID oder Sender-ID');
      return;
    }
    const currentUser = await firstValueFrom(this.userDataService.user$);
    const currentUserName = currentUser?.name || '';

    const isSelfChat = this.senderId === currentUserName ||
      this.senderId.endsWith('(Du)');

    if (isSelfChat) {
      this.navigateToSelfChat(currentUserName);
    } else {
      this.chatNavigationService.openDirectMessageWith(this.senderId);
    }

    this.showMenu = false;
  }

  private async navigateToSelfChat(userName: string) {
    try {
      const email = (await firstValueFrom(this.userDataService.user$))?.email?.toLowerCase() || '';
      const chatId = [email, email].sort().join('_');
      this.router.navigate(['/directMessage', chatId]);
    } catch (error) {
      console.error('Fehler beim Öffnen des Self-Chat:', error);
      this.chatNavigationService.openDirectMessageWith(userName);
    }
  }

  togglePicker(evt: MouseEvent) {
    evt.stopPropagation();
    if (!this.showPicker) {
      this.checkAvailableSpace();
      this.showPicker = true;
      this.showMenu = false;
      setTimeout(() => this.fixEmojiPicker(), 100);
    } else {
      this.showPicker = false;
    }
  }

  toggleMenu(evt: MouseEvent) {
    evt.stopPropagation();
    this.showMenu = !this.showMenu;
    this.showPicker = false;
  }

  triggerEdit() {
    this.onEdit.emit({ messageId: this.messageId, messageText: this.messageText });
    this.showMenu = false;
  }

  addReaction(event: any) {
    this.onReaction.emit(event);
    this.showPicker = false;
  }

  addQuickReaction(emoji: string) {
    this.onReaction.emit({ emoji: { native: emoji } });
  }

  private checkAvailableSpace() {
    const rect = this.elementRef.nativeElement.getBoundingClientRect();
    const availableBelow = window.innerHeight - rect.bottom;
    this.shouldShowPickerOnTop = availableBelow < 350;
  }

  private fixEmojiPicker() {
    if (!this.emojiPickerRef?.nativeElement) return;
    const picker = this.emojiPickerRef.nativeElement as HTMLElement;
    const input = picker.querySelector('.emoji-mart-search input') as HTMLInputElement | null;

    if (input) {
      this.renderer.listen(input, 'input', (e: any) => {
        const noRes = picker.querySelector('.emoji-mart-no-results') as HTMLElement | null;
        if (!noRes) return;
        if (e.target.value) this.renderer.addClass(noRes, 'has-search-results');
        else this.renderer.removeClass(noRes, 'has-search-results');
      });
      const noRes = picker.querySelector('.emoji-mart-no-results') as HTMLElement | null;
      if (noRes) this.renderer.removeClass(noRes, 'has-search-results');
    }
  }

  @HostListener('document:click', ['$event'])
  closeOnOutsideClick(event: Event) {
    if (this.showPicker && this.emojiPickerRef && !this.emojiPickerRef.nativeElement.contains(event.target)) {
      this.showPicker = false;
    }
    if (this.showMenu) this.showMenu = false;
  }
}
