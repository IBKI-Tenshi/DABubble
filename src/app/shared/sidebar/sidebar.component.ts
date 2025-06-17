// import { Component, ViewChild, OnInit } from '@angular/core';
// import { MatButtonModule } from '@angular/material/button';
// import { MatDialogModule } from '@angular/material/dialog';
// import { MatMenuModule } from '@angular/material/menu';
// import { RouterModule, Router } from '@angular/router';
// import { MatIconModule } from '@angular/material/icon';
// import { MatDrawer, MatSidenavModule } from '@angular/material/sidenav';
// import { MatToolbarModule } from '@angular/material/toolbar';
// import { CommonModule } from '@angular/common';

// import { FirestoreService } from '../../services/firestore.service';
// import { AvatarService } from '../../services/avatar.service';
// import { UserDataService, UserProfile } from '../../services/user_data.service';



// @Component({
//   selector: 'app-sidebar',
//   standalone: true,
//   imports: [
//     CommonModule,
//     MatToolbarModule,
//     MatSidenavModule,
//     MatIconModule,
//     RouterModule,
//     MatMenuModule,
//     MatButtonModule,
//     MatDialogModule,
//     MatDrawer,
//   ],
//   templateUrl: './sidebar.component.html',
//   styleUrl: './sidebar.component.scss',
// })
// export class SidebarComponent implements OnInit {
//   showChannels = false;
//   showDMs: boolean = false;

//   users: any[] = [];
//   currentUserEmail: string = '';

//   channels = ['General', 'Frontend', 'Backend'];

//   constructor(
//     private firestore: FirestoreService,
//     private avatarService: AvatarService,
//     private userService: UserDataService,
//     private router: Router,
//   ) { }

//   ngOnInit() {
//     // Email des aktuellen Nutzers holen
//     this.userService.user$.subscribe((user: UserProfile | null) => {
//       if (user) {
//         this.currentUserEmail = user.email || '';
//       }
//     });

//     // Alle Nutzer für DM-Liste holen
//     this.firestore.getAllUsers().subscribe(users => {
//       this.users = users.documents.map((doc: any, index: number) => {
//         const name = doc.fields.name?.stringValue || 'Unbekannt';
//         const avatar =
//           doc.fields.avatar?.stringValue ||
//           this.avatarService.profileArray[index % this.avatarService.profileArray.length];
//         const email = doc.fields.email?.stringValue || 'unbekannt@email.com';

//         return { name, avatar, email };
//       });
//     });
//   }



//   toggleChannels() {
//     this.showChannels = !this.showChannels;
//   }

//   toggleDMs() {
//     this.showDMs = !this.showDMs;
//   }

//   addChannel(event?: MouseEvent) {
//     event?.stopPropagation();
//     console.log('Neuer Channel hinzufügen');
//     // hier kommt später dein Logik-Code für das Hinzufügen eines Channels
//   }

//   getChatId(email1: string, email2: string): string {
//     const participants = [email1, email2].sort();
//     return `chat_${participants[0]}_${participants[1]}`;
//   }


//   // async openChatWithUser(otherEmail: string) {
//   //   const chatId = this.getChatId(otherEmail);
//   //   const chatDoc = await this.firestore.getChatById(chatId);

//   //   if (!chatDoc.exists()) {
//   //     // Chat noch nicht vorhanden: erstelle ihn
//   //     await this.firestore.createChat(chatId, [this.currentUserEmail, otherEmail]);
//   //   }

//   //   // Weiterleitung erfolgt immer am Ende
//   //   this.router.navigate(['/dm', chatId]);
//   // }


//   async openChatWithUser(otherEmail: string) {
//     const chatId = this.getChatId(this.currentUserEmail, otherEmail);

//     console.log("test1");
    

//     try {
//       const chatDoc = await this.firestore.getChatById(chatId);

//       if (!chatDoc.exists()) {
//         await this.firestore.createChat(chatId, [this.currentUserEmail, otherEmail]);
//         console.log('🟢 Neuer Chat wurde erstellt:', chatId);
//       } else {
//         console.log('ℹ️ Chat existiert bereits:', chatId);
//       }

//       this.router.navigate(['/dm', chatId]);
//     } catch (error) {
//       console.error('❌ Fehler beim Öffnen oder Erstellen des Chats:', error);
//     }
//   }



// }




import { Component, ViewChild, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatMenuModule } from '@angular/material/menu';
import { RouterModule, Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatDrawer, MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { CommonModule } from '@angular/common';

import { FirestoreService } from '../../services/firestore.service';
import { AvatarService } from '../../services/avatar.service';
import { UserDataService, UserProfile } from '../../services/user_data.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [
    CommonModule,
    MatToolbarModule,
    MatSidenavModule,
    MatIconModule,
    RouterModule,
    MatMenuModule,
    MatButtonModule,
    MatDialogModule,
    MatDrawer,
  ],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss',
})
export class SidebarComponent implements OnInit {
  showChannels = false;
  showDMs: boolean = false;
  users: any[] = [];
  currentUserEmail: string = '';
  channels = ['General', 'Frontend', 'Backend'];

  constructor(
    private firestore: FirestoreService,
    private avatarService: AvatarService,
    private userService: UserDataService,
    private router: Router,
  ) { }

  ngOnInit() {
    this.userService.user$.subscribe((user: UserProfile | null) => {
      if (user) {
        this.currentUserEmail = user.email || '';
      }
    });

    this.firestore.getAllUsers().subscribe(users => {
      this.users = users.documents.map((doc: any, index: number) => {
        const name = doc.fields.name?.stringValue || 'Unbekannt';
        const avatar = doc.fields.avatar?.stringValue || this.avatarService.profileArray[index % this.avatarService.profileArray.length];
        const email = doc.fields.email?.stringValue || 'unbekannt@email.com';

        return { name, avatar, email };
      });
    });
  }

  toggleChannels() {
    this.showChannels = !this.showChannels;
  }

  toggleDMs() {
    this.showDMs = !this.showDMs;
  }

  addChannel(event?: MouseEvent) {
    event?.stopPropagation();
    console.log('Neuer Channel hinzufügen');
  }

  getChatId(email1: string, email2: string): string {
    const participants = [email1, email2].sort();
    return `chat_${participants[0]}_${participants[1]}`;
  }

  async openChatWithUser(otherEmail: string) {
    const chatId = this.getChatId(this.currentUserEmail, otherEmail);
    try {
      const chatDoc = await this.firestore.getChatById(chatId);

      if (!chatDoc.exists()) {
        await this.firestore.createChat(chatId, [this.currentUserEmail, otherEmail]);
        console.log('🟢 Neuer Chat wurde erstellt:', chatId);
      } else {
        console.log('ℹ️ Chat existiert bereits:', chatId);
      }

      this.router.navigate(['/directMessage', chatId]);
    } catch (error) {
      console.error('❌ Fehler beim Öffnen oder Erstellen des Chats:', error);
    }
  }
}
