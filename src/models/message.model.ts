import { Timestamp } from 'firebase/firestore';

export interface Message {
  text: string;
  senderId: string;
  // timestamp: Timestamp;
    timestamp: string;
}