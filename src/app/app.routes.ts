import { Routes } from '@angular/router';
import { DashboardComponent } from './dashboard/dashboard.component';
import { UserComponent } from './user/user.component';
import { UserDetailComponent } from './user-detail/user-detail.component';
import { LoginComponent } from './login/login.component';
import { UserAccountComponent } from './create-account/user-account/user-account.component';
import { PrivacyComponent } from './privacy/privacy.component';
import { AvatarSelectionComponent } from './create-account/avatar-selection/avatar-selection.component';
import { DirectMessageComponent } from './direct-message/direct-message.component';
import { PasswordEmailComponent } from './password/password-email/password-email.component';
import { PasswordResetComponent } from './password/password-reset/password-reset.component';
import { ChannelChatComponent } from './channel-chat/channel-chat.component';


export const routes: Routes = [
  { path: 'a', component: LoginComponent },
  // Auskommentiert, da nicht benötigt: { path: 'dashboard', component: DashboardComponent },
  // Auskommentiert, da nicht benötigt: { path: 'user', component: UserComponent },
  { path: 'user/:id', component: UserDetailComponent },
  { path: 'accountCreation', component: UserAccountComponent },
  { path: 'avatarSelection', component: AvatarSelectionComponent },
  { path: 'directMessage', component: DirectMessageComponent }, // Diese Route aktivieren
  { path: 'directMessage/:chatId', component: DirectMessageComponent },
  { path: '', component: LoginComponent },
  { path: 'privacy', component: PrivacyComponent },
  { path: 'password', component: PasswordEmailComponent },
  { path: 'passwordReset', component: PasswordResetComponent },
  { path: 'channelChat/:channelId', component: ChannelChatComponent },

  // Fügen Sie eine Wildcard-Route hinzu, um nicht gefundene URLs aufzufangen
  { path: '**', redirectTo: '' },



];
