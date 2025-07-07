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
  @Input() showAddChannel = true;
  @Output() showAddChannelChange = new EventEmitter<boolean>();
  @Output() createChannel = new EventEmitter<void>();
 
   channelForm!: FormGroup;
  nameErrorMessage: string = '';

 constructor(private firestore: FirestoreService, private fb: FormBuilder,) {

 }

  ngOnChanges(changes: SimpleChanges): void {
    throw new Error('Method not implemented.');
  }

  async addChannel() {

    // const newChannelName = prompt('Name des neuen Channels eingeben:');
    // if (!newChannelName || newChannelName.trim().length === 0) {
    //   return;
    // }
    console.log("Test");
    
    const channelName = this.channelForm.value.name.trim();
    await this.firestore.createChannel(channelName);

    // const trimmedName = newChannelName.trim();
    // this.firestore.createChannel(trimmedName).then(() => {
    //   this.channels.push(trimmedName);
    // }).catch((error) => {});

  this.closeModal();
}

  closeModal(event?: Event): void {
    this.showAddChannel = false;
    this.showAddChannelChange.emit(this.showAddChannel);

    if (event) {
      event.preventDefault();
    }
    
  
    this.nameErrorMessage = '';
  }
}
