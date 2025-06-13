import { Routes } from '@angular/router';
import { DashboardComponent } from './dashboard/dashboard.component';
import { UserComponent } from './user/user.component';
import { UserDetailComponent } from './user-detail/user-detail.component';
import { LoginComponent } from './login/login.component';
import { UserAccountComponent } from './create-account/user-account/user-account.component';
import { PrivacyComponent } from './privacy/privacy.component';
import { AvatarSelectionComponent } from './create-account/avatar-selection/avatar-selection.component';

export const routes: Routes = [
  { path: '', component: LoginComponent },
  { path: 'dashboard', component: DashboardComponent },
  { path: 'user', component: UserComponent },
  { path: 'user/:id', component: UserDetailComponent }, // ":" ist wichtig sonst wird "id" als text interpretiert
  { path: 'accountCreation', component: UserAccountComponent },
  { path: 'avatarSelection', component: AvatarSelectionComponent },

  { path: 'privacy', component: PrivacyComponent },
];
