import {
  Component,
  Input,
  Output,
  EventEmitter,
  HostBinding,
  HostListener,
  ViewEncapsulation,
  ElementRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';

interface Reaction {
  emoji: string;
  count: number;
  users: string[];
}

interface ReactionTooltip {
  visible: boolean;
  emoji: string;
  users: string[];
  x: number;
  y: number;
}

@Component({
  selector: 'app-reaction-bubble',
  standalone: true,
  imports: [CommonModule],
  encapsulation: ViewEncapsulation.Emulated,
  template: `
    <span class="emoji">{{ reaction.emoji }}</span>
    <span class="count">{{ reaction.count }}</span>

    <!-- Tooltip -->
    <div
      *ngIf="tooltip.visible"
      class="reaction-tooltip"
      [style.left.px]="tooltip.x"
      [style.top.px]="tooltip.y"
    >
      <div class="tooltip-content">
        <div class="tooltip-emoji">{{ tooltip.emoji }}</div>
        <div class="tooltip-users">
          <div *ngIf="tooltip.users.length === 1" class="tooltip-user">
            {{ tooltip.users[0] }}
          </div>
          <div *ngIf="tooltip.users.length === 1" class="tooltip-action">
            hat reagiert
          </div>

          <div *ngIf="tooltip.users.length > 1" class="tooltip-user">
            {{ tooltip.users.join(', ') }}
          </div>
          <div *ngIf="tooltip.users.length > 1" class="tooltip-action">
            haben reagiert
          </div>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./reaction-bubble.component.scss'],
})
export class ReactionBubbleComponent {
  @Input() reaction!: Reaction;
  @Input() currentUser: string = '';
  @Output() reactionClick = new EventEmitter<Reaction>();

  @HostBinding('class.reaction-bubble') hostIsBubble = true;

  @HostBinding('class.selected')
  get isSelected(): boolean {
    return !!this.reaction?.users?.includes?.(this.currentUser);
  }

  tooltip: ReactionTooltip = {
    visible: false,
    emoji: '',
    users: [],
    x: 0,
    y: 0,
  };

  constructor(private elRef: ElementRef<HTMLElement>) {}

  @HostListener('click')
  onReactionClick(): void {
    if (this.reaction) {
      this.reactionClick.emit(this.reaction);
    }
  }

  @HostListener('mouseenter')
  showTooltip(): void {
    if (!this.reaction) return;

    const rect = this.elRef.nativeElement.getBoundingClientRect();
    const OFFSET_X = 12;
    const OFFSET_Y = 8;

    this.tooltip = {
      visible: true,
      emoji: this.reaction.emoji,
      users: [...(this.reaction.users || [])],
      x: rect.right + OFFSET_X,
      y: rect.top - OFFSET_Y,
    };
  }

  @HostListener('mouseleave')
  hideTooltip(): void {
    this.tooltip.visible = false;
  }
}