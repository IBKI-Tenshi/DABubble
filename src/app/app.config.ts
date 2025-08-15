import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideHttpClient } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { MatNativeDateModule } from '@angular/material/core';
import { APP_INITIALIZER } from '@angular/core';
import { UserDataService } from './services/user_data.service';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { getFirestore, provideFirestore } from '@angular/fire/firestore';

import { getAuth, provideAuth } from '@angular/fire/auth';

export function initUser(user: UserDataService) {
  return () => user.init();
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideAnimations(),
    provideRouter(routes),
    provideAnimationsAsync(),
    provideHttpClient(),
    importProvidersFrom(MatNativeDateModule),
    provideFirebaseApp(() =>
      initializeApp({
        apiKey: 'AIzaSyDALtinxju3qAE1H5SY9BqsQKve9GBOn84',
        authDomain: 'dabubble-7e942.firebaseapp.com',
        projectId: 'dabubble-7e942',
        storageBucket: 'dabubble-7e942.firebasestorage.app',
        messagingSenderId: '225459377281',
        appId: '1:225459377281:web:5016a79ff01e1ba6e0a980',
      })
    ),
    provideFirestore(() => getFirestore()),
    provideAuth(() => getAuth()),
    { provide: APP_INITIALIZER, useFactory: initUser, deps: [UserDataService], multi: true },
  ],
};
