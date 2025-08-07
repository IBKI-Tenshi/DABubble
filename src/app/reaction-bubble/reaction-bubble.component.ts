import { Component, Input, Output, EventEmitter } from '@angular/core';
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
  template: `
    <div class="reaction-bubble"
         [class.selected]="isSelected"
         (click)="onReactionClick()"
         (mouseenter)="showTooltip($event)"
         (mouseleave)="hideTooltip()">
      <span class="emoji">{{ reaction.emoji }}</span>
      <span class="count">{{ reaction.count }}</span>
    </div>

    <!-- Tooltip -->
    <div *ngIf="tooltip.visible" 
         class="reaction-tooltip"
         [style.left.px]="tooltip.x"
         [style.top.px]="tooltip.y">
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
  styleUrls: ['./reaction-bubble.component.scss']
})
export class ReactionBubbleComponent {
  @Input() reaction!: Reaction;
  @Input() currentUser: string = '';
  @Output() reactionClick = new EventEmitter<Reaction>();

  tooltip: ReactionTooltip = {
    visible: false,
    emoji: '',
    users: [],
    x: 0,
    y: 0
  };

  get isSelected(): boolean {
    return this.reaction.users.includes(this.currentUser);
  }

  showTooltip(event: MouseEvent): void {
    const rect = (event.target as HTMLElement).getBoundingClientRect();
    
    this.tooltip = {
      visible: true,
      emoji: this.reaction.emoji,
      users: [...this.reaction.users],
      x: rect.right + 95, 
      y: rect.top + 8
    };
  }

  hideTooltip(): void {
    this.tooltip.visible = false;
  }

  onReactionClick(): void {
    this.reactionClick.emit(this.reaction);
  }
}