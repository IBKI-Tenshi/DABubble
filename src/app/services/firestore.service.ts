

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
  orderBy,
  where,
  getDocs
} from '@angular/fire/firestore';




import { Timestamp } from '@angular/fire/firestore'; // ✅ RICHTIG

import { map } from 'rxjs/operators';



@Injectable({
  providedIn: 'root',
})
export class FirestoreService {
  constructor(
    private http: HttpClient,
    private urlService: UrlService,
    private firestore: Firestore
  ) { }

  // REST: Nutzer (nur hier sinnvoll)
  getAllUsers(): Observable<any> {
    const url = `${this.urlService.BASE_URL}/users`;
    return this.http.get(url);
  }

// async getUserByEmail(email: string): Promise<any> {
//   const usersRef = collection(this.firestore, 'users');
//   const q = query(usersRef, where('email', '==', email));
//   const querySnapshot = await getDocs(q);
//   if (!querySnapshot.empty) {
//     // nehme den ersten Treffer
//     const userDoc = querySnapshot.docs[0];
//     return userDoc.data();
//   }
//   return null;
// }


  // Firestore: Chat-Dokument lesen
  async getChatById(chatId: string): Promise<any> {
    const chatDocRef = doc(this.firestore, 'chats', chatId);
    console.log(chatId);

    const snapshot = await getDoc(chatDocRef);
    console.log("test getChatById ende der funktion");

    return snapshot;
  }

  // Firestore: Chat-Dokument erstellen
  // als iso string
  // createChat(chatId: string, participants: string[]): Promise<void> {
  //   const chatDocRef = doc(this.firestore, 'chats', chatId);
  //   return setDoc(chatDocRef, {
  //     participants,
  //     createdAt: new Date().toISOString()
  //   });
  // }

  // als timestamp
  createChat(chatId: string, participants: string[]): Promise<void> {
    const chatDocRef = doc(this.firestore, 'chats', chatId);
    console.log('🟢 Erstelle Chat mit ID:', chatId, 'und Teilnehmern:', participants);

    return setDoc(chatDocRef, {
      participants,
      createdAt: Timestamp.now()
    });
  }


  //  Firestore: Nachrichten auslesen (Subcollection mit Live-Update)
  
  // getChatMessages(chatId: string): Observable<Message[]> {
  //             console.log("getChatMessages() triggert");
  //   const messagesCollection = collection(this.firestore, 'chats', chatId, 'messages');
  //             console.log("getChatMessages() triggert" + messagesCollection);
  //   const messagesQuery = query(messagesCollection, orderBy('timestamp', 'asc'));

  //   // return collectionData(messagesQuery, { idField: 'id' }) as Observable<Message[]>;
  //   return collectionData(messagesQuery) as Observable<Message[]>;

  // }

  getChatMessages(chatId: string): Observable<Message[]> {
    console.log("getChatMessages() triggert");
    const messagesCollection = collection(this.firestore, 'chats', chatId, 'messages');
    console.log("getChatMessages() 2");
    const messagesQuery = query(messagesCollection, orderBy('timestamp', 'asc'));
    console.log("getChatMessages() 3");
    return collectionData(messagesQuery, { idField: 'id' }) as Observable<Message[]>;
  }

  // Firestore: Neue Nachricht hinzufügen
  addMessageToChat(chatId: string, message: Message): Promise<void> {
    const messagesCollection = collection(this.firestore, 'chats', chatId, 'messages');
    return addDoc(messagesCollection, message).then(() => { });
  }


  getChannelMessages(channelId: string): Observable<Message[]> {
  const messagesCollection = collection(this.firestore, 'channels', channelId, 'messages');
  const messagesQuery = query(messagesCollection, orderBy('timestamp', 'asc'));
  return collectionData(messagesQuery, { idField: 'id' }) as Observable<Message[]>;
}

addMessageToChannel(channelId: string, message: Message): Promise<void> {
  const messagesCollection = collection(this.firestore, 'channels', channelId, 'messages');
  return addDoc(messagesCollection, message).then(() => { });
}


}

