import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ChatNavigationService {

  private refreshSubject = new Subject<string>();
  refresh$ = this.refreshSubject.asObservable();


  constructor() { }

  triggerRefresh(chatId: string) {
    this.refreshSubject.next(chatId);
  }
}
