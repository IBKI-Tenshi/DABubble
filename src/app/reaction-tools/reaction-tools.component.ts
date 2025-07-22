import { Component, Input, Output, EventEmitter, HostListener, ElementRef, ViewChild } from '@angular/core';
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
export class ReactionToolsComponent {
  @Input() isOwn: boolean = false;
  @Input() messageId: string = '';
  @Input() messageText: string = '';
  @Output() onEdit = new EventEmitter<{ messageId: string, messageText: string }>();
  @Output() onReaction = new EventEmitter<any>();
  @ViewChild('emojiPicker') emojiPickerRef: ElementRef | undefined;

  showPicker: boolean = false;
  showOptions: boolean = false;

  emojiCategories: string[] = [
    'people',
    'nature',
    'foods',
    'activity',
    'objects',
    'symbols'
  ];

  togglePicker(event: MouseEvent) {
    event.stopPropagation();
    this.showPicker = !this.showPicker;
    this.showOptions = false;
  }

  triggerEdit() {
    this.onEdit.emit({ messageId: this.messageId, messageText: this.messageText });
    this.showOptions = false;
  }

  addReaction(event: any) {
    this.onReaction.emit(event);
    this.showPicker = false;
  }

  toggleOptions(event: MouseEvent) {
    event.stopPropagation();
    this.showOptions = !this.showOptions;
    this.showPicker = false;
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
  }
}