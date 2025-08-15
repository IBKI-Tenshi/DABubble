import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { FirestoreService } from '../services/firestore.service';
import { UserDataService } from '../services/user_data.service';
import { ChatPartnerService } from '../services/chat-partner.service';

@Injectable({ providedIn: 'root' })
export class ChatNavigationService {
  private refreshSubject = new Subject<string>();
  refresh$ = this.refreshSubject.asObservable();

  constructor(
    private fs: FirestoreService,
    private router: Router,
    private partners: ChatPartnerService,
    private userData: UserDataService
  ) {}

  triggerRefresh(chatId: string) {
    this.refreshSubject.next(chatId);
  }

  async openDMRoot(): Promise<void> {
    await this.router.navigate(['/directMessage']);
  }

  
  async openDirectMessageWith(targetName: string, targetAvatar?: string) {
    const me = this.userData.getName() || localStorage.getItem('slack_clone_user_name') || 'Unbekannt';
    const names = [me, targetName];

    let chatId = await this.fs.findDirectChatByParticipants(names);
    if (!chatId) chatId = await this.fs.createDirectChat(names);

    // Partner-Daten cachen (Self-DM => Partner = ich selbst)
    const partnerName = targetName || me;
    const avatar = targetAvatar || this.userData.getProfileImage() || '/assets/img/dummy_pic.png';
    this.partners.setChatPartner(chatId, partnerName, avatar);

    await this.router.navigate(['/directMessage', chatId], { queryParams: { name: partnerName, avatar } });
  }
}
