import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DecimalPipe } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { Store } from '../store';
@Component({
  standalone: true, imports: [IonicModule, FormsModule, DecimalPipe],
  template: `
<ion-header><ion-toolbar color="dark"><ion-buttons slot="start"><ion-back-button defaultHref="/problem"></ion-back-button></ion-buttons><ion-title>Schedule pickup</ion-title></ion-toolbar></ion-header>
<ion-content class="ion-padding">
  @if (s.dealer(); as d) {
    <ion-card><ion-card-content><b>{{ d.name }}</b> · {{ d.phone }}<br>Toyota Fielder · KDA 245X<br>Issue: {{ s.draft().category }}<br>Pickup: {{ s.draft().pickup }} → {{ d.name }}</ion-card-content></ion-card>
    <ion-item><ion-input type="date" label="Pickup date" [(ngModel)]="date"></ion-input></ion-item>
    <ion-item><ion-select label="Time slot" [(ngModel)]="slot">@for (t of slots; track t) { <ion-select-option [value]="t">{{ t }}</ion-select-option> }</ion-select></ion-item>
    <ion-item><ion-textarea label="Notes for driver" labelPlacement="stacked" [(ngModel)]="notes"></ion-textarea></ion-item>
    <ion-list><ion-list-header>Illustrative estimate (fictional)</ion-list-header>
      <ion-item>Dispatch fee<span slot="end">KES {{ d.fee }}</span></ion-item><ion-item>Towing<span slot="end">KES 2,000</span></ion-item>
      <ion-item>Inspection<span slot="end">KES 800</span></ion-item><ion-item>Repair estimate<span slot="end">KES 1,500</span></ion-item>
      <ion-item><b>Total</b><b slot="end">KES {{ s.estimate(d) | number }}</b></ion-item></ion-list>
    @if (err) { <ion-text color="danger"><p>{{ err }}</p></ion-text> }
    <ion-button expand="block" color="warning" (click)="ok()">Confirm request</ion-button>
    <p><small>Simulated – nothing is sent to a real provider and no payment is taken.</small></p>
  } @else { <p>No dealer selected.</p> }
</ion-content>`,
})
export class SchedulePage {
  s = inject(Store); r = inject(Router);
  date = new Date().toISOString().slice(0, 10); slot = ''; notes = ''; err = '';
  slots = ['ASAP (within 30 min)', '10:00 – 11:00', '12:00 – 13:00', '15:00 – 16:00'];
  ok() { if (!this.date || !this.slot) { this.err = 'Choose a date and time slot.'; return; } this.s.create(this.date, this.slot, this.notes); this.r.navigate(['/track']); }
}
