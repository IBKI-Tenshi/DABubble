import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class UserDataService {
  private _name: string = '';
  private _userId: string = '';

  constructor() {}

  setName(name: string): void {
    this._name = name;
  }

  setUserId(userId: string): void {
    this._userId = userId;
  }

  getName(): string {
    return this._name;
  }

  getUserId(): string {
    return this._userId;
  }
}
