import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class GoogleAuth {
  private callbackFn:
    | ((response: google.accounts.id.CredentialResponse) => void)
    | null = null;

  initializeGoogleAuth(
    callback: (response: google.accounts.id.CredentialResponse) => void
  ) {
    this.callbackFn = callback;

    google.accounts.id.initialize({
      client_id:
        '996939012758-t5ckq9m6kv89o8354soli6tavt23k1ho.apps.googleusercontent.com',
      callback: (response) => this.callbackFn?.(response),
      auto_select: false,
      cancel_on_tap_outside: true,
    });

    google.accounts.id.prompt((notification) => {
      console.log('Prompt notification:', notification);
    });
  }
}
