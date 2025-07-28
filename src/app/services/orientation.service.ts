import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class OrientationService {
  private mediaQueryList = window.matchMedia('(orientation: portrait)');
  private isPortraitSubject = new BehaviorSubject<boolean>(this.mediaQueryList.matches);
  isPortrait$ = this.isPortraitSubject.asObservable();

  constructor() {
    this.mediaQueryList.addEventListener('change', this.handleOrientationChange);
  }

  private handleOrientationChange = (event: MediaQueryListEvent) => {
    this.isPortraitSubject.next(event.matches);
  };
}
