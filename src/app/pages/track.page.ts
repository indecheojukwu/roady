import { Component, inject, AfterViewInit, OnDestroy, effect } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DecimalPipe, DatePipe } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import * as L from 'leaflet';
import { Store, STAGES, TASKS, QUOTE, HOME, dist } from '../store';
@Component({
  standalone: true, imports: [IonicModule, FormsModule, DecimalPipe, DatePipe],
  template: `
<ion-header><ion-toolbar color="dark"><ion-buttons slot="start"><ion-back-button defaultHref="/dashboard"></ion-back-button></ion-buttons><ion-title>Tracking <ion-badge color="warning">DEMO</ion-badge></ion-title></ion-toolbar></ion-header>
<ion-content>
@if (s.booking(); as b) {
  <div id="tmap" style="height:40vh"></div>
  <ion-card><ion-card-content>
    <b>{{ b.ref }}</b> · <ion-badge>{{ stages[b.stage] }}</ion-badge><br>
    Driver: Peter Otieno · +254 7XX 000 111 · Isuzu recovery truck KCZ 410M<br>
    Garage: {{ b.destination }}<br>
    @if (b.stage < 6) { Remaining: {{ remaining() | number:'1.1-1' }} km · ETA {{ eta() }} min <small>(simulated route)</small> }
    <ion-progress-bar [value]="b.stage / 12"></ion-progress-bar>
  </ion-card-content></ion-card>

  @if (b.stage >= 8 && b.stage < 12 || b.quote === 'declined') {
    <ion-card><ion-card-header><ion-card-title>Quotation (fictional sample prices)</ion-card-title></ion-card-header><ion-card-content>
      Findings: front-right tyre punctured, repairable. Est. completion 1 hour. Valid 24 hours.
      @for (q of quote; track q.n) { <div>{{ q.n }}: KES {{ q.a | number }}</div> }
      <b>Total: KES {{ total | number }}</b> (tax KES 0)<br>
      @if (b.stage === 8 && b.quote === 'pending') {
        <ion-button (click)="s.approve()">Approve Repair</ion-button><ion-button fill="outline" (click)="chg=!chg">Request Changes</ion-button><ion-button color="danger" fill="outline" (click)="s.decline()">Decline</ion-button>
        @if (chg) { <ion-textarea placeholder="Extra instructions" [(ngModel)]="note"></ion-textarea><ion-button size="small" (click)="s.patch({notes: b.notes + ' | Change: ' + note}); chg=false">Save</ion-button> }
      } @else { Status: {{ b.quote }} }
    </ion-card-content></ion-card>
  }
  @if (b.stage >= 10) {
    <ion-card><ion-card-header><ion-card-title>Repair progress</ion-card-title></ion-card-header><ion-card-content>
      @for (t of tasks; track t; let i = $index) { <div>{{ i < b.repairStep ? '✅' : '⬜' }} {{ t }}</div> }
    </ion-card-content></ion-card>
  }
  @if (b.stage === 12) {
    <ion-card id="invoice"><ion-card-header><ion-card-title>Invoice INV-{{ b.ref.slice(4) }}</ion-card-title></ion-card-header><ion-card-content>
      Toyota Fielder KDA 245X · {{ s.dealer()?.name }}<br>
      @for (q of quote; track q.n) { <div>{{ q.n }}: KES {{ q.a | number }}</div> }
      <div>Pickup/dispatch + towing + inspection: KES {{ b.est - 1500 | number }}</div>
      <b>Total: KES {{ total + b.est - 1500 | number }}</b><br><small>Sample invoice, {{ now | date:'medium' }}</small><br>
      <ion-button size="small" (click)="print()">View / Download Invoice</ion-button>
      @if (!b.review) { <br>Rate dealer:
        @for (n of [1,2,3,4,5]; track n) { <span style="font-size:26px" (click)="stars=n">{{ n <= stars ? '★' : '☆' }}</span> }
        <ion-input placeholder="Review" [(ngModel)]="text"></ion-input><ion-button size="small" (click)="s.patch({review:{stars:stars,text:text}})" [disabled]="!stars">Submit</ion-button>
      } @else { <p>Your review: {{ b.review.stars }}★ {{ b.review.text }}</p> }
      <ion-button size="small" fill="outline" (click)="r.navigate(['/dashboard'])">Return to Dashboard</ion-button>
    </ion-card-content></ion-card>
  }
  <ion-card color="light"><ion-card-header><ion-card-title>Timeline</ion-card-title></ion-card-header><ion-card-content>
    @for (t of stages; track t; let i = $index) { <div [style.opacity]="i <= b.stage ? 1 : .35">{{ i <= b.stage ? '●' : '○' }} {{ t }}</div> }
  </ion-card-content></ion-card>
  <ion-card color="warning"><ion-card-header><ion-card-title>Presenter controls</ion-card-title></ion-card-header><ion-card-content>
    <ion-button size="small" color="dark" (click)="s.advance()" [disabled]="b.stage===12 || (b.stage===8 && b.quote!=='approved')">Next stage</ion-button>
    <ion-button size="small" color="dark" fill="outline" (click)="s.reset()">Reset demo</ion-button>
    @if (b.stage===8 && b.quote!=='approved') { <small>Waiting for customer to approve quotation.</small> }
  </ion-card-content></ion-card>
} @else { <p class="ion-padding">No active booking. Start from the dashboard.</p> }
</ion-content>`,
})
export class TrackPage implements AfterViewInit, OnDestroy {
  s = inject(Store); r = inject(Router);
  stages = STAGES; tasks = TASKS; quote = QUOTE; total = 2000; chg = false; note = ''; stars = 0; text = ''; now = new Date();
  map?: L.Map; truck?: L.Marker; route: [number, number][] = []; timer: any;
  constructor() { effect(() => { this.s.booking(); this.move(); }); }
  pickup() { return { lat: HOME.lat, lng: HOME.lng }; }
  garage() { const d = this.s.dealer()!; return { lat: d.lat, lng: d.lng }; }
  remaining() { return dist(this.pickup(), this.garage()) * (1 - (this.s.booking()?.progress ?? 0)); }
  eta() { return Math.ceil(this.remaining() / 0.4); }
  pos(): [number, number] {
    const b = this.s.booking()!, p = this.pickup(), g = this.garage();
    if (b.stage < 3) return [g.lat, g.lng];
    if (b.stage < 5) { const k = b.stage === 3 ? .5 : 1; return [g.lat + (p.lat - g.lat) * k, g.lng + (p.lng - g.lng) * k]; }
    const i = Math.min(this.route.length - 1, Math.round(b.progress * (this.route.length - 1))); return this.route[i];
  }
  ngAfterViewInit() {
    const b = this.s.booking(); if (!b || !this.s.dealer()) return;
    const p = this.pickup(), g = this.garage();
    this.route = Array.from({ length: 25 }, (_, i) => { const t = i / 24, w = Math.sin(t * Math.PI) * 0.004; return [p.lat + (g.lat - p.lat) * t + w, p.lng + (g.lng - p.lng) * t] as [number, number]; });
    setTimeout(() => {
      try {
        this.map = L.map('tmap').setView([p.lat, p.lng], 13);
        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OpenStreetMap' }).addTo(this.map);
        const ic = (e: string) => L.divIcon({ html: `<div style="font-size:26px">${e}</div>`, className: '', iconSize: [30, 30] });
        L.marker([p.lat, p.lng], { icon: ic('📍') }).bindPopup('Pickup').addTo(this.map);
        L.marker([g.lat, g.lng], { icon: ic('🏁') }).bindPopup('Garage').addTo(this.map);
        L.polyline(this.route, { color: '#f97316', dashArray: '6' }).bindTooltip('Simulated route').addTo(this.map);
        this.truck = L.marker(this.pos(), { icon: ic('🚛') }).addTo(this.map);
      } catch { /* tiles unavailable: panels still work */ }
    }, 100);
    this.timer = setInterval(() => { const c = this.s.booking(); if (c?.stage === 5) { const n = c.progress + 0.08; n >= 1 ? this.s.patch({ progress: 1, stage: 6 }) : this.s.patch({ progress: n }); } }, 1500);
  }
  move() { if (this.truck && this.s.booking()) this.truck.setLatLng(this.pos()); }
  print() { window.print(); }
  ngOnDestroy() { clearInterval(this.timer); this.map?.remove(); }
}
