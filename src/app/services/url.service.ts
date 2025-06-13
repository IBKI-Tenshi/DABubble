import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class UrlService {
  constructor() {}
  public BASE_URL: string =
    'https://firestore.googleapis.com/v1/projects/dabubble-7e942/databases/(default)/documents';
}
