

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { UrlService } from './url.service';
import { Observable } from 'rxjs';
import { Message } from '../../models/message.model';
import { firstValueFrom } from 'rxjs';


@Injectable({
  providedIn: 'root',
})
export class FirestoreService {
  constructor(
    private http: HttpClient,
    private urlService: UrlService
  ) { }

  // GET: Alle Benutzer laden
  getAllUsers(): Observable<any> {
    const url = `${this.urlService.BASE_URL}/users`;
    return this.http.get(url);
  }

  // GET: Alle Channels laden
  getAllChannels(): Observable<any[]> {
    const url = `${this.urlService.BASE_URL}/channels`;
    return this.http.get<any[]>(url);
  }

  // GET: Nachrichten eines Channels
  getChannelMessages(channelId: string): Observable<Message[]> {
    const url = `${this.urlService.BASE_URL}/channels/${channelId}/messages`;
    return this.http.get<Message[]>(url);
  }

  // POST: Neue Nachricht zu einem Channel hinzufügen
  addMessageToChannel(channelId: string, message: Message): Promise<any> {
    const url = `${this.urlService.BASE_URL}/channels/${channelId}/messages`;

    const firestoreFormattedMessage = {
      fields: {
        text: { stringValue: message.text },
        senderId: { stringValue: message.senderId },
        timestamp: { timestampValue: message.timestamp.toISOString() }
      }
    };
    return firstValueFrom(this.http.post(url, firestoreFormattedMessage));
  }

  // GET: Chat-Dokument abrufen
  getChatById(chatId: string): Observable<any> {
    const url = `${this.urlService.BASE_URL}/chats/${chatId}`;
    return this.http.get(url);
  }

  // POST: Chat-Dokument erstellen
  createChat(chatId: string, participants: string[]): Observable<any> {
    const url = `${this.urlService.BASE_URL}/chats`;
    return this.http.post(url, {
      chatId,
      participants,
      createdAt: new Date().toISOString()
    });
  }

  createChannel(channelName: string): Promise<void> {
    const url = `${this.urlService.BASE_URL}/channels`;

    // Wenn deine API das Firestore-ähnliche Format erwartet:
    const newChannel = {
      fields: {
        name: { stringValue: channelName }
        // hier ggf. weitere Felder
      }
    };

    // POST an die API senden und Promise zurückgeben
    return firstValueFrom(this.http.post(url, newChannel))
      .then(() => { /* Erfolg - keine Rückgabe nötig */ })
      .catch((err: any) => Promise.reject(err));
  }


  // GET: Nachrichten eines Chats
  getChatMessages(chatId: string): Observable<Message[]> {
    const url = `${this.urlService.BASE_URL}/chats/${chatId}/messages`;
    return this.http.get<Message[]>(url);
  }

  // POST: Neue Nachricht zu einem Chat hinzufügen
  async addMessageToChat(chatId: string, message: Message): Promise<any> {
    const url = `${this.urlService.BASE_URL}/chats/${chatId}/messages`;

    const firestoreFormattedMessage = {
      fields: {
        text: { stringValue: message.text },
        senderId: { stringValue: message.senderId },
        timestamp: { timestampValue: message.timestamp.toISOString() }
      }
    };

    console.log("📤 addMessageToChat wird gesendet");

    return firstValueFrom(this.http.post(url, firestoreFormattedMessage));
  }


}
