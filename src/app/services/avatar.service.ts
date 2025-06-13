import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class AvatarService {
  constructor() {}
  public selectedAvatar: string = '../../../assets/img/avatar/default.png';

  public profileArray: string[] = [
    '../../../assets/img/avatar/avatar_1.png',
    '../../../assets/img/avatar/avatar_2.png',
    '../../../assets/img/avatar/avatar_3.png',
    '../../../assets/img/avatar/avatar_4.png',
    '../../../assets/img/avatar/avatar_5.png',
    '../../../assets/img/avatar/avatar_6.png',
  ];
}
