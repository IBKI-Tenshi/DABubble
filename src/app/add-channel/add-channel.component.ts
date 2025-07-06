import { Component, ElementRef, EventEmitter, inject, Input, OnChanges, Output, SimpleChanges, ViewChild } from '@angular/core';
import { FirestoreService } from '../services/firestore.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { LoginService } from '../services/login.service';

@Component({
  selector: 'app-add-channel',
  standalone: true,
  imports: [],
  templateUrl: './add-channel.component.html',
  styleUrl: './add-channel.component.scss'
})
export class AddChannelComponent  implements OnChanges {
 
 

  nameErrorMessage: string = '';



  ngOnChanges(changes: SimpleChanges): void {
    throw new Error('Method not implemented.');
  }

  closeModal(event?: Event): void {
    if (event) {
      event.preventDefault();
    }
    
  
    this.nameErrorMessage = '';
  }
}
