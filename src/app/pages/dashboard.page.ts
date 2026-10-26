import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { Store, STAGES } from '../store';
@Component({
  standalone: true, imports: [IonicModule, RouterLink],
  template: `
<ion-header><ion-toolbar color="dark"><ion-title>Roadside Assist <ion-badge color="warning">DEMO</ion-badge></ion-title></ion-toolbar></ion-header>
<ion-content class="ion-padding">
  <h2>Hello, James Mwangi</h2>
  <ion-card><ion-card-content><b>Toyota Fielder 2015</b> · KDA 245X<br>Status: {{ s.booking() ? stages[s.booking()!.stage] : 'Parked – no active request' }}</ion-card-content></ion-card>
  <ion-button expand="block" color="warning" routerLink="/dealers">🚨 Get Roadside Assistance</ion-button>
  <ion-button expand="block" fill="outline" routerLink="/dealers">Find a Mechanic</ion-button>
  @if (s.booking(); as b) {
    <ion-card color="light"><ion-card-header><ion-card-title>Active booking {{ b.ref }}</ion-card-title></ion-card-header>
      <ion-card-content>{{ stages[b.stage] }}<br>{{ s.dealer()?.name }}<br><ion-button routerLink="/track" size="small">Track vehicle</ion-button></ion-card-content></ion-card>
  }
  <h3>Quick actions</h3>
  @for (q of quick; track q) { <ion-chip (click)="soon(q)">{{ q }}</ion-chip> }
  <h3>Service history</h3>
  <ion-list><ion-item><ion-label>Full service – Westlands Auto Care<p>12 Mar 2026 · KES 6,500</p></ion-label></ion-item><ion-item><ion-label>Battery replacement – ABC Motor Garage<p>03 Nov 2025 · KES 9,800</p></ion-label></ion-item></ion-list>
  <ion-toast [isOpen]="msg !== ''" [message]="msg" [duration]="2000" (didDismiss)="msg=''"></ion-toast>
</ion-content>`,
})
export class DashboardPage {
  s = inject(Store); stages = STAGES; msg = '';
  quick = ['Towing', 'Ambulance transport', 'Cargo transport', 'Crane hire', 'Machinery hire'];
  soon(q: string) { this.msg = q + ' – demo only, not implemented'; }
}
