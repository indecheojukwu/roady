import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { Store } from '../store';
@Component({
  standalone: true, imports: [IonicModule, FormsModule],
  template: `
<ion-header><ion-toolbar color="dark"><ion-buttons slot="start"><ion-back-button defaultHref="/dealers"></ion-back-button></ion-buttons><ion-title>Describe the problem</ion-title></ion-toolbar></ion-header>
<ion-content class="ion-padding">
  <p>Dealer: <b>{{ s.dealer()?.name ?? 'None selected' }}</b></p>
  <ion-item><ion-select label="Vehicle" value="v"><ion-select-option value="v">Toyota Fielder 2015 – KDA 245X</ion-select-option></ion-select></ion-item>
  <ion-item><ion-select label="Category" [(ngModel)]="d.category">@for (c of cats; track c) { <ion-select-option [value]="c">{{ c }}</ion-select-option> }</ion-select></ion-item>
  <ion-item><ion-textarea label="Describe the issue" labelPlacement="stacked" rows="4" [(ngModel)]="d.description"></ion-textarea></ion-item>
  <ion-item><ion-select label="Drivable?" [(ngModel)]="d.drivable"><ion-select-option>Yes</ion-select-option><ion-select-option>No</ion-select-option></ion-select></ion-item>
  <ion-item><ion-select label="Safe location?" [(ngModel)]="d.safe"><ion-select-option>Yes</ion-select-option><ion-select-option>No</ion-select-option></ion-select></ion-item>
  <ion-item><ion-input label="Current location" labelPlacement="stacked" [(ngModel)]="d.pickup"></ion-input></ion-item>
  <ion-item><ion-select label="Assistance" [(ngModel)]="d.assist">@for (a of assists; track a) { <ion-select-option [value]="a">{{ a }}</ion-select-option> }</ion-select></ion-item>
  @if (err) { <ion-text color="danger"><p>{{ err }}</p></ion-text> }
  <ion-button expand="block" color="warning" (click)="next()">Continue to scheduling</ion-button>
</ion-content>`,
})
export class ProblemPage {
  s = inject(Store); r = inject(Router); d = { ...this.s.draft() }; err = '';
  cats = ['Tyre puncture', 'Engine failure', 'Battery failure', 'Brake problem', 'Accident damage', 'Overheating', 'Electrical fault', 'Other'];
  assists = ['Mobile mechanic', 'Tow to garage', 'Pickup and repair', 'Repair at current location'];
  next() {
    if (!this.s.dealerId()) { this.err = 'Please select a dealer first.'; return; }
    if (!this.d.description?.trim() || !this.d.pickup?.trim()) { this.err = 'Description and location are required.'; return; }
    this.s.draft.set(this.d); this.r.navigate(['/schedule']);
  }
}
