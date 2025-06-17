import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FirestoreService } from '../services/firestore.service';
import { Message } from '../../models/message.model';

@Component({
  selector: 'app-direct-message',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './direct-message.component.html',
  styleUrls: ['./direct-message.component.scss']
})
export class DirectMessageComponent implements OnInit {
  messages: Message[] = [];

  constructor(private firestore: FirestoreService) {}

  ngOnInit(): void {
    this.firestore.getMessages('chat_test_1').subscribe(response => {
      console.log('Firestore response:', response);

      if ((response as any).documents) {
        this.messages = (response as any).documents.map((doc: any) => ({
          text: doc.fields?.text?.stringValue || '',
          senderId: doc.fields?.senderId?.stringValue || '',
          timestamp: doc.fields?.timestamp?.timestampValue || '',
        }));
      } else {
        this.messages = [];
        console.warn('Keine Dokumente in der Antwort');
      }
    });
  }
}
