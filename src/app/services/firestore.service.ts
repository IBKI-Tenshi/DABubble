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

  getAllUsers(): Observable<any> {
    const url = `${this.urlService.BASE_URL}/users`;
    return this.http.get(url);
  }

  getAllChannels(): Observable<any[]> {
    const url = `${this.urlService.BASE_URL}/channels`;
    return this.http.get<any[]>(url);
  }

  getChannelMessages(channelId: string): Observable<Message[]> {
    const url = `${this.urlService.BASE_URL}/channels/${channelId}/messages`;
    return this.http.get<Message[]>(url);
  }

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

  getChatById(chatId: string): Observable<any> {
    const encodedChatId = encodeURIComponent(chatId);
    const url = `${this.urlService.BASE_URL}/chats/${encodedChatId}`;
    console.log("🔍 Suche Chat mit URL:", url);
    return this.http.get(url);
  }

  createChat(chatId: string, participants: string[]): Promise<any> {
    const encodedChatId = encodeURIComponent(chatId);
    const url = `${this.urlService.BASE_URL}/chats?documentId=${encodedChatId}`;
    
    const firestoreFormattedChat = {
      fields: {
        participants: { 
          arrayValue: { 
            values: participants.map(p => ({ stringValue: p })) 
          } 
        },
        createdAt: { timestampValue: new Date().toISOString() }
      }
    };
    
    console.log("📤 Sende Chat-Erstellung (Methode 1):", url, firestoreFormattedChat);
    return firstValueFrom(this.http.post(url, firestoreFormattedChat));
  }

  createChatAlt(chatId: string, participants: string[]): Promise<any> {
    const encodedChatId = encodeURIComponent(chatId);
    const url = `${this.urlService.BASE_URL}/chats/${encodedChatId}`;
    const firestoreFormattedChat = {
      fields: {
        participants: { 
          arrayValue: { 
            values: participants.map(p => ({ stringValue: p })) 
          } 
        },
        createdAt: { timestampValue: new Date().toISOString() }
      }
    };
    
    console.log("📤 Sende Chat-Erstellung (Methode 2):", url, firestoreFormattedChat);
    return firstValueFrom(this.http.put(url, firestoreFormattedChat));
  }

  createChannel(channelName: string): Promise<void> {
    const url = `${this.urlService.BASE_URL}/channels`;
    const newChannel = {
      fields: {
        name: { stringValue: channelName }
      }
    };

    return firstValueFrom(this.http.post(url, newChannel))
      .then(() => {})
      .catch((err: any) => Promise.reject(err));
  }

  getChatMessages(chatId: string): Observable<Message[]> {
    const encodedChatId = encodeURIComponent(chatId);
    const url = `${this.urlService.BASE_URL}/chats/${encodedChatId}/messages`;
    return this.http.get<Message[]>(url);
  }

  async addMessageToChat(chatId: string, message: Message): Promise<any> {
    const encodedChatId = encodeURIComponent(chatId);
    const url = `${this.urlService.BASE_URL}/chats/${encodedChatId}/messages`;

    const firestoreFormattedMessage = {
      fields: {
        text: { stringValue: message.text },
        senderId: { stringValue: message.senderId },
        timestamp: { timestampValue: message.timestamp.toISOString() }
      }
    };

    console.log("📤 addMessageToChat wird gesendet:", url);

    return firstValueFrom(this.http.post(url, firestoreFormattedMessage));
  }

  testCreateSimpleDocument(): Promise<any> {
    const url = `${this.urlService.BASE_URL}/test_documents`;
    const simpleDoc = {
      fields: {
        test: { stringValue: "test_value" }
      }
    };
    
    console.log("🧪 Teste einfaches Dokument erstellen:", url, simpleDoc);
    return firstValueFrom(this.http.post(url, simpleDoc));
  }
}