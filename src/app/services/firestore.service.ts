// services/firestore.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { UrlService } from './url.service';
import { Observable } from 'rxjs';
import { Message, ThreadReply } from '../models/message.model';
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

  generateChatId(user1Id: string, user2Id: string): string {
    const ids = [user1Id, user2Id].sort();
    return btoa(`${ids[0]}_${ids[1]}`).replace(/=/g, '');
  }

  createChat(chatId: string, participants: string[], participantNames: string[]): Promise<any> {
    const encodedChatId = encodeURIComponent(chatId);
    const url = `${this.urlService.BASE_URL}/chats?documentId=${encodedChatId}`;

    const firestoreFormattedChat = this.formatChatForFirestore(participants, participantNames);

    return firstValueFrom(this.http.post(url, firestoreFormattedChat));
  }

  private formatChatForFirestore(participants: string[], participantNames: string[]) {
    const displayName = `Chat mit ${participantNames.join(' und ')}`;
    
    return {
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
        displayName: { stringValue: displayName },
        createdAt: { timestampValue: new Date().toISOString() }
      }
    };
  }

  createChannel(channelName: string, description?: any): Promise<void> {
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

  getThreadMessages(messageId: string): Observable<any> {
    const url = `${this.urlService.BASE_URL}/messages/${messageId}/thread`;
    return this.http.get(url);
  }

  async addReplyToThread(messageId: string, reply: ThreadReply): Promise<any> {
    const url = `${this.urlService.BASE_URL}/messages/${messageId}/thread`;

    const firestoreFormattedMessage = {
      fields: {
        text: { stringValue: reply.text },
        senderId: { stringValue: reply.senderId },
        timestamp: { timestampValue: reply.timestamp.toISOString() },
        threadId: { stringValue: messageId },
        // Falls Avatar-URL vorhanden ist
        avatar: reply.avatar ? { stringValue: reply.avatar } : { nullValue: null }
      }
    };

    try {
      const response = await firstValueFrom(this.http.post(url, firestoreFormattedMessage));
      
      // Nach erfolgreicher Antwort: Zähler der ursprünglichen Nachricht erhöhen
      await this.updateThreadRepliesCount(messageId);
      
      return response;
    } catch (error) {
      console.error('Fehler beim Hinzufügen einer Thread-Antwort:', error);
      throw error;
    }
  }

  async updateThreadRepliesCount(messageId: string): Promise<any> {
    // Zuerst aktuelle Antworten zählen
    const threadResponse = await firstValueFrom(this.getThreadMessages(messageId));
    const documents = threadResponse?.documents || [];
    const count = documents.length;
    
    const url = `${this.urlService.BASE_URL}/messages/${messageId}`;
    
    const updateData = {
      fields: {
        threadRepliesCount: { integerValue: count }
      }
    };
    
    return firstValueFrom(this.http.patch(url, updateData));
  }

  async updateMessageText(chatId: string, messageId: string, newText: string): Promise<any> {
    // Update the text of a specific message in Firestore
    const encodedChatId = encodeURIComponent(chatId);
    const url = `${this.urlService.BASE_URL}/chats/${encodedChatId}/messages/${messageId}`;
    
    const updateData = {
      fields: {
        text: { stringValue: newText }
      }
    };
    
    return firstValueFrom(this.http.patch(url, updateData));
  }

  async updateMessageReactions(chatId: string, messageId: string, reactions: any[]): Promise<any> {
    const url = `${this.urlService.BASE_URL}/chats/${chatId}/messages/${messageId}`;
    
    const reactionsArray = reactions.map(reaction => ({
      mapValue: {
        fields: {
          emoji: { stringValue: reaction.emoji },
          count: { integerValue: reaction.count.toString() },
          users: { 
            arrayValue: { 
              values: reaction.users.map((user: string) => ({ stringValue: user })) 
            } 
          }
        }
      }
    }));
    
    const updateData = {
      fields: {
        reactions: { 
          arrayValue: { 
            values: reactionsArray 
          } 
        }
      }
    };
    
    return firstValueFrom(this.http.patch(url, updateData));
  }

  async updateChannelMessage(channelId: string, messageId: string, updateData: any): Promise<any> {
    const url = `${this.urlService.BASE_URL}/channels/${channelId}/messages/${messageId}`;
    
    const firestoreData: any = { fields: {} };
    
    if (updateData.reactions) {
      const reactionsArray = updateData.reactions.map((reaction: any) => ({
        mapValue: {
          fields: {
            emoji: { stringValue: reaction.emoji },
            count: { integerValue: reaction.count.toString() },
            users: { 
              arrayValue: { 
                values: reaction.users.map((user: string) => ({ stringValue: user })) 
              } 
            }
          }
        }
      }));
      
      firestoreData.fields.reactions = { 
        arrayValue: { 
          values: reactionsArray 
        } 
      };
    }
    
    return firstValueFrom(this.http.patch(url, firestoreData));
  }
  
  async updateThreadReply(threadId: string, replyId: string, updateData: any): Promise<any> {
    const url = `${this.urlService.BASE_URL}/messages/${threadId}/thread/${replyId}`;
    
    const firestoreData: any = { fields: {} };
    
    if (updateData.reactions) {
      const reactionsArray = updateData.reactions.map((reaction: any) => ({
        mapValue: {
          fields: {
            emoji: { stringValue: reaction.emoji },
            count: { integerValue: reaction.count.toString() },
            users: { 
              arrayValue: { 
                values: reaction.users.map((user: string) => ({ stringValue: user })) 
              } 
            }
          }
        }
      }));
      
      firestoreData.fields.reactions = { 
        arrayValue: { 
          values: reactionsArray 
        } 
      };
    }
    
    return firstValueFrom(this.http.patch(url, firestoreData));
  }
  
}

