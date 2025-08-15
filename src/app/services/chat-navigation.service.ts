import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { FirestoreService } from '../services/firestore.service';
import { UserDataService } from '../services/user_data.service';

@Injectable({ providedIn: 'root' })
export class ChatNavigationService {
  private refreshSubject = new Subject<string>();
  refresh$ = this.refreshSubject.asObservable();

  constructor(
    private router: Router,
    private firestore: FirestoreService,
    private userData: UserDataService
  ) {}

  triggerRefresh(chatId: string) {
    this.refreshSubject.next(chatId);
  }

  async openDMRoot(): Promise<void> {
    await this.router.navigate(['/directMessage']);
  }

  async openDirectMessageWith(otherUserName: string): Promise<void> {
    const me = this.userData.getName();
    if (!otherUserName || !me) {

      await this.openDMRoot();
      return;
    }

    if (otherUserName === me) {
      await this.openDMRoot();
      return;
    }
    const chatId = await this.ensureDirectChat([me, otherUserName]);
    await this.router.navigate(['/directMessage', chatId]);
  }

  private async ensureDirectChat(participantNames: string[]): Promise<string> {
    const existing = await this.firestore.findDirectChatByParticipants(participantNames);
    if (existing) return existing;

    return await this.firestore.createDirectChat(participantNames);
  }
}
