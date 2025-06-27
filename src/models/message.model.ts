
import { Timestamp } from '@angular/fire/firestore'; // ✅ RICHTIG


export interface Message {
  text: string;
  senderId: string;
  timestamp: Date;
  // timestamp: Timestamp | any;
    // timestamp: string;
}