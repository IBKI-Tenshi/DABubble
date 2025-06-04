


import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';

import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideHttpClient } from '@angular/common/http';

import { MatNativeDateModule } from '@angular/material/core';

import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { getFirestore, provideFirestore } from '@angular/fire/firestore';

export const appConfig: ApplicationConfig = {     // der kommende part ist um das projekt mit der firebase backend zu verbinden
  providers: [
    provideRouter(routes),
    provideAnimationsAsync(),
    provideHttpClient(),
    importProvidersFrom(MatNativeDateModule),
    provideFirebaseApp(() =>
      initializeApp({
        apiKey: "AIzaSyDiLcAldhsOGjYsIbbQup2xNxIbFO5Hjy0",
        authDomain: "simplecrm-80a5b.firebaseapp.com",
        projectId: "simplecrm-80a5b",
        storageBucket: "simplecrm-80a5b.appspot.com",
        messagingSenderId: "805197682589",
        appId: "1:805197682589:web:04d2c819a4b5b7588dc174"
      })
    ),
    provideFirestore(() => getFirestore())
  ]
};
