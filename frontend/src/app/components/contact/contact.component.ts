import { Component } from '@angular/core';

@Component({
  selector: 'app-contact',
  templateUrl: './contact.component.html',
  styleUrls: ['./contact.component.css']
})
export class ContactComponent {
  name = '';
  email = '';
  message = '';
  submitted = false;

  onSubmit(): void {
    if (!this.name.trim() || !this.email.trim() || !this.message.trim()) {
      return;
    }
    // Hook this up to a real backend/email service when available.
    this.submitted = true;
    this.name = '';
    this.email = '';
    this.message = '';
  }
}
