import { Component, ElementRef, EventEmitter, inject, Input, OnChanges, Output, SimpleChanges, ViewChild } from '@angular/core';
import { FirestoreService } from '../services/firestore.service';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { LoginService } from '../services/login.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-add-channel',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './add-channel.component.html',
  styleUrl: './add-channel.component.scss'
})
export class AddChannelComponent  implements OnChanges {
  @Input() showAddChannel = true;
  @Output() showAddChannelChange = new EventEmitter<boolean>();
  @Output() createChannel = new EventEmitter<void>();
  @Output() channelCreated = new EventEmitter<string>();
  @Output() channelName = new EventEmitter<string>();
 
  channelForm!: FormGroup;
  nameErrorMessage: string = '';

 constructor(private firestore: FirestoreService, private fb: FormBuilder,) {
 }

 ngOnInit() {
this.channelForm = this.fb.group({
  name: [''],
  description: ['']
});
 }

  ngOnChanges(changes: SimpleChanges): void {
    throw new Error('Method not implemented.');
  }

 addChannel() {
 const name = this.channelForm.get('name')?.value;
 this.channelName.emit(name);
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
