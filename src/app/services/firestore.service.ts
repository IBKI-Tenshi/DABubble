import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { UrlService } from './url.service';
import { Observable } from 'rxjs';
import { Message, ThreadReply } from '../models/message.model';
import { firstValueFrom } from 'rxjs';
import { collection, Firestore } from 'firebase/firestore';
import { collectionData } from '@angular/fire/firestore';

@Injectable({
  providedIn: 'root',
})
export class FirestoreService {
  constructor(
    private http: HttpClient,
    private urlService: UrlService,
  ) { }

  getAllUsers(): Observable<any> {
    const url = `${this.urlService.BASE_URL}/users`;
    return this.http.get(url);
  }

  getAllChannels(): Observable<any[]> {
    const url = `${this.urlService.BASE_URL}/channels`;
    return this.http.get<any[]>(url);
  }

  // getAllChannelsCollectionData(): Observable<any[]> {
  //   const channelsCollection = collection(this.firestore, 'channels');
  //   return collectionData(channelsCollection, { idField: 'id' }) as Observable<any[]>;
  // }

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
      .then(() => { })
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
        avatar: reply.avatar ? { stringValue: reply.avatar } : { nullValue: null }
      }
    };

    try {
      const response = await firstValueFrom(this.http.post(url, firestoreFormattedMessage));
      await this.updateThreadRepliesCount(messageId);

      return response;
    } catch (error) {
      console.error('Fehler beim Hinzufügen einer Thread-Antwort:', error);
      throw error;
    }
  }

  async updateThreadRepliesCount(messageId: string): Promise<any> {
    const threadResponse = await firstValueFrom(this.getThreadMessages(messageId));
    const documents = threadResponse?.documents || [];
    const count = documents.length;

    const url = `${this.urlService.BASE_URL}/messages/${messageId}?updateMask.fieldPaths=threadRepliesCount`;

    const updateData = {
      fields: {
        threadRepliesCount: { integerValue: String(count) }
      }
    };

    return firstValueFrom(this.http.patch(url, updateData));
  }

  async updateMessageText(chatId: string, messageId: string, newText: string): Promise<any> {
    const encodedChatId = encodeURIComponent(chatId);
    const url = `${this.urlService.BASE_URL}/chats/${encodedChatId}/messages/${messageId}?updateMask.fieldPaths=text`;

    const updateData = {
      fields: {
        text: { stringValue: newText }
      }
    };

    return firstValueFrom(this.http.patch(url, updateData));
  }

  async updateMessageReactions(chatId: string, messageId: string, reactions: any[]): Promise<any> {
    const encodedChatId = encodeURIComponent(chatId);
    const url = `${this.urlService.BASE_URL}/chats/${encodedChatId}/messages/${messageId}?updateMask.fieldPaths=reactions`;

    const reactionsArray = reactions.map(r => ({
      mapValue: {
        fields: {
          emoji: { stringValue: r.emoji },
          count: { integerValue: String(r.count) },
          users: {
            arrayValue: { values: r.users.map((u: string) => ({ stringValue: u })) }
          }
        }
      }
    }));

    const updateData = {
      fields: {
        reactions: { arrayValue: { values: reactionsArray } }
      }
    };

    return firstValueFrom(this.http.patch(url, updateData));
  }

  async updateChannelMessage(channelId: string, messageId: string, updateData: any): Promise<any> {
    let url = `${this.urlService.BASE_URL}/channels/${channelId}/messages/${messageId}`;
    const firestoreData: any = { fields: {} };
    const masks: string[] = [];

    if (updateData.reactions) {
      const reactionsArray = updateData.reactions.map((r: any) => ({
        mapValue: {
          fields: {
            emoji: { stringValue: r.emoji },
            count: { integerValue: String(r.count) },
            users: {
              arrayValue: { values: r.users.map((u: string) => ({ stringValue: u })) }
            }
          }
        }
      }));
      firestoreData.fields.reactions = { arrayValue: { values: reactionsArray } };
      masks.push('reactions');
    }

    if (masks.length) {
      url += `?` + masks.map(m => `updateMask.fieldPaths=${encodeURIComponent(m)}`).join('&');
    }

    return firstValueFrom(this.http.patch(url, firestoreData));
  }

  async updateThreadReply(threadId: string, replyId: string, updateData: any): Promise<any> {
    let url = `${this.urlService.BASE_URL}/messages/${threadId}/thread/${replyId}`;
    const firestoreData: any = { fields: {} };
    const masks: string[] = [];

    if (updateData.reactions) {
      const reactionsArray = updateData.reactions.map((r: any) => ({
        mapValue: {
          fields: {
            emoji: { stringValue: r.emoji },
            count: { integerValue: String(r.count) },
            users: {
              arrayValue: { values: r.users.map((u: string) => ({ stringValue: u })) }
            }
          }
        }
      }));
      firestoreData.fields.reactions = { arrayValue: { values: reactionsArray } };
      masks.push('reactions');
    }

    if (masks.length) {
      url += `?` + masks.map(m => `updateMask.fieldPaths=${encodeURIComponent(m)}`).join('&');
    }

    return firstValueFrom(this.http.patch(url, firestoreData));
  }

  async findDirectChatByParticipants(names: string[]): Promise<string | null> {
    const [a, b] = [...names].sort((x, y) => x.localeCompare(y));
    const query = {
      structuredQuery: {
        from: [{ collectionId: 'chats' }],
        where: {
          compositeFilter: {
            op: 'AND',
            filters: [
              { fieldFilter: { field: { fieldPath: 'isDirect' }, op: 'EQUAL', value: { booleanValue: true } } },
              { fieldFilter: { field: { fieldPath: 'participants' }, op: 'ARRAY_CONTAINS', value: { stringValue: a } } },
              { fieldFilter: { field: { fieldPath: 'participants' }, op: 'ARRAY_CONTAINS', value: { stringValue: b } } }
            ]
          }
        },
        limit: 1
      }
    };

    const res = await fetch(`${this.urlService.BASE_URL}:runQuery`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(query)
    });
    const rows = await res.json();
    const doc = rows.find((r: any) => r?.document)?.document;
    return doc?.name?.split('/').pop() ?? null;
  }

  async createDirectChat(names: string[]): Promise<string> {
    const [a, b] = [...names].sort((x, y) => x.localeCompare(y));
    const body = {
      fields: {
        isDirect: { booleanValue: true },
        participants: { arrayValue: { values: [a, b].map(n => ({ stringValue: n })) } },
        participantNames: { arrayValue: { values: [a, b].map(n => ({ stringValue: n })) } },
        displayName: { stringValue: `Chat mit ${a} und ${b}` },
        createdAt: { timestampValue: new Date().toISOString() },
        lastMessageAt: { timestampValue: new Date().toISOString() }
      }
    };

    const res = await fetch(`${this.urlService.BASE_URL}/chats`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const doc = await res.json();
    return doc.name.split('/').pop();
  }
}


