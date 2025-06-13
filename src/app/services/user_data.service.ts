import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class UserDataService {
  private _name: string = '';

  constructor() {}

  setName(name: string): void {
    this._name = name;
  }

  getName(): string {
    return this._name;
  }
}
