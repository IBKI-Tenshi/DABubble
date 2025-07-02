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

  getAllChats(): Observable<any> {
    const url = `${this.urlService.BASE_URL}/chats`;
    return this.http.get(url);
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
    return this.http.get(url);
  }

  // generateChatId(name1: string, name2: string, email1: string, email2: string): string {
  //   const displayName = `Chat zwischen ${name1} und ${name2}`;
  //   const sanitizedName = displayName
  //     .replace(/[\/\.\#\$\[\]]/g, ' ')
  //     .replace(/\s+/g, ' ');
      
  //   return sanitizedName;
  // }

generateChatId(email1: string, email2: string): string {
  const sortedEmails = [email1, email2].sort();
  return `${sortedEmails[0]}_${sortedEmails[1]}`;
}



  createChat(chatId: string, participants: string[], participantNames: string[]): Promise<any> {
    const encodedChatId = encodeURIComponent(chatId);
    const url = `${this.urlService.BASE_URL}/chats?documentId=${encodedChatId}`;
    
    const displayName = `Chat zwischen ${participantNames.join(' und ')}`;
    
    const firestoreFormattedChat = {
      fields: {
        participants: { 
          arrayValue: { 
            values: participants.map(p => ({ stringValue: p })) 
          } 
        },
        participantNames: { 
          arrayValue: { 
            values: participantNames.map(name => ({ stringValue: name })) 
          } 
        },
        displayName: { 
          stringValue: displayName
        },
        createdAt: { timestampValue: new Date().toISOString() }
      }
    };
    
    return firstValueFrom(this.http.post(url, firestoreFormattedChat));
  }

  createChatAlt(chatId: string, participants: string[], participantNames: string[]): Promise<any> {
    const encodedChatId = encodeURIComponent(chatId);
    const url = `${this.urlService.BASE_URL}/chats/${encodedChatId}`;
    
    const displayName = `Chat zwischen ${participantNames.join(' und ')}`;
    
    const firestoreFormattedChat = {
      fields: {
        participants: { 
          arrayValue: { 
            values: participants.map(p => ({ stringValue: p })) 
          } 
        },
        participantNames: { 
          arrayValue: { 
            values: participantNames.map(name => ({ stringValue: name })) 
          } 
        },
        displayName: { 
          stringValue: displayName
        },
        createdAt: { timestampValue: new Date().toISOString() }
      }
    };
    
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

    return firstValueFrom(this.http.post(url, firestoreFormattedMessage));
  }
}