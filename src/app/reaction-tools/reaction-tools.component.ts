import { Component, Input, Output, EventEmitter, HostListener, ElementRef, ViewChild, Renderer2, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { PickerComponent } from '@ctrl/ngx-emoji-mart';

@Component({
  selector: 'app-reaction-tools',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    PickerComponent
  ],
  templateUrl: './reaction-tools.component.html',
  styleUrls: ['./reaction-tools.component.scss']
})
export class ReactionToolsComponent implements AfterViewInit {
  @Input() isOwn: boolean = false;
  @Input() messageId: string = '';
  @Input() messageText: string = '';
  @Output() onEdit = new EventEmitter<{ messageId: string, messageText: string }>();
  @Output() onReaction = new EventEmitter<any>();
  @Output() onDelete = new EventEmitter<string>();
  @ViewChild('emojiPicker') emojiPickerRef: ElementRef | undefined;

  showPicker: boolean = false;
  showOptions: boolean = false;
  showMenu: boolean = false;
  shouldShowPickerOnTop: boolean = false;

  emojiCategories: string[] = [
    'people',
    'nature',
    'foods',
    'activity',
    'objects',
    'symbols',
    'places', 
    'flags'
  ];

  constructor(private renderer: Renderer2, private elementRef: ElementRef) {}

  ngAfterViewInit() {
    setTimeout(() => {
      this.fixEmojiPicker();
    }, 100);
  }

  private fixEmojiPicker() {
    if (this.emojiPickerRef?.nativeElement) {
      const searchInput = this.emojiPickerRef.nativeElement.querySelector('.emoji-mart-search input');
      
      if (searchInput) {
        this.renderer.listen(searchInput, 'input', (event) => {
          const noResultsElement = this.emojiPickerRef?.nativeElement.querySelector('.emoji-mart-no-results');
          
          if (noResultsElement) {
            if (event.target.value) {
              this.renderer.addClass(noResultsElement, 'has-search-results');
            } else {
              this.renderer.removeClass(noResultsElement, 'has-search-results');
            }
          }
        });

        const noResultsElement = this.emojiPickerRef.nativeElement.querySelector('.emoji-mart-no-results');
        if (noResultsElement) {
          this.renderer.removeClass(noResultsElement, 'has-search-results');
        }
      }
    }
  }

  togglePicker(event: MouseEvent) {
    event.stopPropagation();
    
    if (!this.showPicker) {
      this.checkAvailableSpace();
    } else {
      this.showPicker = false;
      this.showOptions = false;
      this.showMenu = false;
      return;
    }
    
    this.showPicker = true;
    this.showOptions = false;
    this.showMenu = false;
    
    setTimeout(() => {
      this.fixEmojiPicker();
    }, 100);
  }

  checkAvailableSpace() {
    const rect = this.elementRef.nativeElement.getBoundingClientRect();
    const availableSpaceBelow = window.innerHeight - rect.bottom;
    const requiredSpace = 350;
    this.shouldShowPickerOnTop = availableSpaceBelow < requiredSpace;
  }

  triggerEdit() {
    this.onEdit.emit({ messageId: this.messageId, messageText: this.messageText });
    this.showOptions = false;
    this.showMenu = false;
  }

  addReaction(event: any) {
    this.onReaction.emit(event);
    this.showPicker = false;
  }

  addQuickReaction(emoji: string) {
    const emojiData = {
      emoji: {
        native: emoji
      }
    };
    this.onReaction.emit(emojiData);
  }

  toggleOptions(event: MouseEvent) {
    event.stopPropagation();
    this.showOptions = !this.showOptions;
    this.showPicker = false;
    this.showMenu = false;
  }

  toggleMenu(event: MouseEvent) {
    event.stopPropagation();
    this.showMenu = !this.showMenu;
    this.showPicker = false;
    this.showOptions = false;
  }

  deleteMessage() {
    this.onDelete.emit(this.messageId);
    this.showMenu = false;
  }

  @HostListener('document:click', ['$event'])
  closeOnOutsideClick(event: Event) {
    if (this.showPicker && this.emojiPickerRef && 
        !this.emojiPickerRef.nativeElement.contains(event.target)) {
      this.showPicker = false;
    }
    
    if (this.showOptions) {
      this.showOptions = false;
    }

    if (this.showMenu) {
      this.showMenu = false;
    }
  }
}