// src/app/models/message.model.ts
export interface Reaction {
  emoji: string;
  count: number;
  users: string[];
}

export interface Message {
  id?: string;
  text: string;
  senderId: string;
  timestamp: Date;
  threadId?: string;        
  threadRepliesCount?: number; 
  avatar?: string;
  reactions?: Reaction[]; 
}

export interface ThreadReply {
  id?: string;              
  text: string;
  senderId: string;
  timestamp: Date;
  threadId: string;         
  avatar?: string;
  reactions?: Reaction[];
}