

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
//   DocumentData,
// } from '@angular/fire/firestore';

// @Injectable({
//   providedIn: 'root',
// })
// export class FirestoreService {
//   constructor(
//     private http: HttpClient,
//     private urlService: UrlService,
//     private firestore: Firestore
//   ) {}

//   // REST: Nutzer (nur hier sinnvoll)
//   getAllUsers(): Observable<any> {
//     const url = `${this.urlService.BASE_URL}/users`;
//     return this.http.get(url);
//   }

//   // Firestore: Chat-Dokument lesen
//   async getChatById(chatId: string): Promise<any> {
//     const chatDocRef = doc(this.firestore, 'chats', chatId);
//     const snapshot = await getDoc(chatDocRef);
//     return snapshot;
//   }

//   // Firestore: Chat-Dokument erstellen
//   createChat(chatId: string, participants: string[]): Promise<void> {
//     const chatDocRef = doc(this.firestore, 'chats', chatId);
//     return setDoc(chatDocRef, {
//       participants,
//       createdAt: new Date().toISOString()
//     });
//   }

//   // Firestore: Nachrichten auslesen (Subcollection)
//   getChatMessages(chatId: string): Observable<Message[]> {
//     const messagesCollection = collection(this.firestore, 'chats', chatId, 'messages');
//     return collectionData(messagesCollection, { idField: 'id' }) as Observable<Message[]>;
//   }

//   // Firestore: Neue Nachricht hinzufügen
//   addMessageToChat(chatId: string, message: Message): Promise<void> {
//     const messagesCollection = collection(this.firestore, 'chats', chatId, 'messages');
//     return addDoc(messagesCollection, message).then(() => {});
//   }
// }



import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { UrlService } from './url.service';
import { Observable } from 'rxjs';
import { Message } from '../../models/message.model';
import {
  Firestore,
  doc,
  getDoc,
  setDoc,
  collection,
  addDoc,
  collectionData,
  query,
  orderBy
} from '@angular/fire/firestore';

@Injectable({
  providedIn: 'root',
})
export class FirestoreService {
  constructor(
    private http: HttpClient,
    private urlService: UrlService,
    private firestore: Firestore
  ) {}

  // REST: Nutzer (nur hier sinnvoll)
  getAllUsers(): Observable<any> {
    const url = `${this.urlService.BASE_URL}/users`;
    return this.http.get(url);
  }

  // Firestore: Chat-Dokument lesen
  async getChatById(chatId: string): Promise<any> {
    const chatDocRef = doc(this.firestore, 'chats', chatId);
    console.log(chatId);
    
    const snapshot = await getDoc(chatDocRef);
    return snapshot;
  }

  // Firestore: Chat-Dokument erstellen
  createChat(chatId: string, participants: string[]): Promise<void> {
    const chatDocRef = doc(this.firestore, 'chats', chatId);
    return setDoc(chatDocRef, {
      participants,
      createdAt: new Date().toISOString()
    });
  }

  //  Firestore: Nachrichten auslesen (Subcollection mit Live-Update)
  getChatMessages(chatId: string): Observable<Message[]> {
    const messagesCollection = collection(this.firestore, 'chats', chatId, 'messages');
    console.log('Collection reference:', messagesCollection);
    const messagesQuery = query(messagesCollection, orderBy('timestamp', 'asc'));
    console.log("load message test2");
    return collectionData(messagesQuery, { idField: 'id' }) as Observable<Message[]>;
  }

  // Firestore: Neue Nachricht hinzufügen
  addMessageToChat(chatId: string, message: Message): Promise<void> {
    const messagesCollection = collection(this.firestore, 'chats', chatId, 'messages');
    return addDoc(messagesCollection, message).then(() => {});
  }
}
