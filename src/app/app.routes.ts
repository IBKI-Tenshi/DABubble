import { Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { UserAccountComponent } from './create-account/user-account/user-account.component';
import { PrivacyComponent } from './shared/privacy/privacy.component';
import { ImprintComponent } from './shared/imprint/imprint.component';
import { AvatarSelectionComponent } from './create-account/avatar-selection/avatar-selection.component';
import { DirectMessageComponent } from './direct-message/direct-message.component';
import { PasswordEmailComponent } from './password/password-email/password-email.component';
import { PasswordResetComponent } from './password/password-reset/password-reset.component';
import { ChannelChatComponent } from './channel-chat/channel-chat.component';


export const routes: Routes = [
  { path: 'a', component: LoginComponent },
  { path: 'accountCreation', component: UserAccountComponent },
  { path: 'avatarSelection', component: AvatarSelectionComponent },
  { path: 'directMessage', component: DirectMessageComponent },
  { path: 'directMessage/:chatId', component: DirectMessageComponent },
  { path: '', component: LoginComponent },
  { path: 'privacy', component: PrivacyComponent },
  { path: 'impressum', component: ImprintComponent },
  { path: 'password', component: PasswordEmailComponent },
  { path: 'passwordReset', component: PasswordResetComponent },
  { path: 'channelChat/:channelId', component: ChannelChatComponent },

  { path: '**', redirectTo: '' },
];