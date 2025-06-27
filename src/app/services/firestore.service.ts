

// import { Injectable } from '@angular/core';
// import { HttpClient } from '@angular/common/http';
// import { UrlService } from './url.service';
// import { Observable } from 'rxjs';
// import { Message } from '../../models/message.model';
// import {
//   Firestore,
//   doc,
//   getDoc,
//   setDoc,
//   collection,
//   addDoc,
//   collectionData,
//   query,
//   orderBy,
//   where,
//   getDocs
// } from '@angular/fire/firestore';

// import { Timestamp } from '@angular/fire/firestore'; // ✅ RICHTIG

// import { map } from 'rxjs/operators';



// @Injectable({
//   providedIn: 'root',
// })
// export class FirestoreService {
//   constructor(
//     private http: HttpClient,
//     private urlService: UrlService,
//     private firestore: Firestore
//   ) { }

//   // REST: Nutzer (nur hier sinnvoll)
//   getAllUsers(): Observable<any> {
//     const url = `${this.urlService.BASE_URL}/users`;
//     return this.http.get(url);
//   }

//   // Firestore: Chat-Dokument lesen
//   async getChatById(chatId: string): Promise<any> {
//     const chatDocRef = doc(this.firestore, 'chats', chatId);
//     console.log(chatId);

//     const snapshot = await getDoc(chatDocRef);
//     console.log("test getChatById ende der funktion");

//     return snapshot;
//   }

//   // Firestore: Chat-Dokument erstellen
//   // als iso string
//   // createChat(chatId: string, participants: string[]): Promise<void> {
//   //   const chatDocRef = doc(this.firestore, 'chats', chatId);
//   //   return setDoc(chatDocRef, {
//   //     participants,
//   //     createdAt: new Date().toISOString()
//   //   });
//   // }

//   // als timestamp
//   createChat(chatId: string, participants: string[]): Promise<void> {
//     const chatDocRef = doc(this.firestore, 'chats', chatId);
//     console.log('🟢 Erstelle Chat mit ID:', chatId, 'und Teilnehmern:', participants);

//     return setDoc(chatDocRef, {
//       participants,
//       createdAt: Timestamp.now()
//     });
//   }


//   //  Firestore: Nachrichten auslesen (Subcollection mit Live-Update)

//   // getChatMessages(chatId: string): Observable<Message[]> {
//   //             console.log("getChatMessages() triggert");
//   //   const messagesCollection = collection(this.firestore, 'chats', chatId, 'messages');
//   //             console.log("getChatMessages() triggert" + messagesCollection);
//   //   const messagesQuery = query(messagesCollection, orderBy('timestamp', 'asc'));

//   //   // return collectionData(messagesQuery, { idField: 'id' }) as Observable<Message[]>;
//   //   return collectionData(messagesQuery) as Observable<Message[]>;

//   // }

//   getChatMessages(chatId: string): Observable<Message[]> {
//     console.log("getChatMessages() triggert");
//     const messagesCollection = collection(this.firestore, 'chats', chatId, 'messages');
//     console.log("getChatMessages() 2");
//     const messagesQuery = query(messagesCollection, orderBy('timestamp', 'asc'));
//     console.log("getChatMessages() 3");
//     return collectionData(messagesQuery, { idField: 'id' }) as Observable<Message[]>;
//   }

//   // Firestore: Neue Nachricht hinzufügen
//   addMessageToChat(chatId: string, message: Message): Promise<void> {
//     const messagesCollection = collection(this.firestore, 'chats', chatId, 'messages');
//     return addDoc(messagesCollection, message).then(() => { });
//   }


//   getChannelMessages(channelId: string): Observable<Message[]> {
//   const messagesCollection = collection(this.firestore, 'channels', channelId, 'messages');
//   const messagesQuery = query(messagesCollection, orderBy('timestamp', 'asc'));
//   return collectionData(messagesQuery, { idField: 'id' }) as Observable<Message[]>;
// }

// addMessageToChannel(channelId: string, message: Message): Promise<void> {
//   const messagesCollection = collection(this.firestore, 'channels', channelId, 'messages');
//   return addDoc(messagesCollection, message).then(() => { });
// }


// getAllChannels(): Observable<any[]> {
//   const channelsCollection = collection(this.firestore, 'channels');
//   return collectionData(channelsCollection, { idField: 'id' });
// }


// }

//   // // REST: Nutzer (nur hier sinnvoll)
//   // getAllUsers(): Observable<any> {
//   //   const url = `${this.urlService.BASE_URL}/users`;
//   //   return this.http.get(url);
//   // }



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
  addMessageToChannel(channelId: string, message: Message): Observable<any> {
    const url = `${this.urlService.BASE_URL}/channels/${channelId}/messages`;
    return this.http.post(url, message);
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
