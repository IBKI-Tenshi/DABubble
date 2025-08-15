import { Injectable } from '@angular/core';

interface ChatPartner {
  id: string;
  name: string;
  avatar: string;
}

@Injectable({
  providedIn: 'root'
})
export class ChatPartnerService {
  private chatPartners = new Map<string, ChatPartner>();
  
  constructor() {
    this.loadSavedPartners();
  }
  
  setChatPartner(chatId: string, name: string, avatar: string): void {
    this.chatPartners.set(chatId, { id: chatId, name, avatar });
    this.savePartners();
  }
  
  getChatPartner(chatId: string): ChatPartner | undefined {
    return this.chatPartners.get(chatId);
  }
  
  private savePartners(): void {
    const partners = Array.from(this.chatPartners.entries()).reduce((obj, [key, value]) => {
      obj[key] = value;
      return obj;
    }, {} as Record<string, ChatPartner>);
    
    localStorage.setItem('slack_clone_chat_partners', JSON.stringify(partners));
  }
  
  private loadSavedPartners(): void {
    const savedPartnersJson = localStorage.getItem('slack_clone_chat_partners');
    if (savedPartnersJson) {
      try {
        const savedPartners = JSON.parse(savedPartnersJson) as Record<string, ChatPartner>;
        this.chatPartners = new Map(Object.entries(savedPartners));
      } catch (e) {
        console.error('Fehler beim Laden der gespeicherten Chat-Partner:', e);
      }
    }
  }
  
  remove(chatId: string) {
    this.chatPartners.delete(chatId);
    this.savePartners();
  }
  
  clearAll() {
    this.chatPartners.clear();
    localStorage.removeItem('slack_clone_chat_partners');
  }
}