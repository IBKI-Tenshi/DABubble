import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { UrlService } from './url.service';
import { Observable } from 'rxjs';
import { Message } from '../../models/message.model';

@Injectable({
  providedIn: 'root',
})
export class FirestoreService {
  constructor(private http: HttpClient, private urlService: UrlService) {}

  getAllUsers(): Observable<any> {
    const url = `${this.urlService.BASE_URL}/users`;
    return this.http.get(url);
  }

  getMessages(chatId: string): Observable<Message[]> {
    const url = `${this.urlService.BASE_URL}/chats/${chatId}/messages`;
    return this.http.get<Message[]>(url);
  }
}
