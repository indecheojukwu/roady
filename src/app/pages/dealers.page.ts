import { Component, inject, AfterViewInit, OnDestroy, signal, computed, effect } from '@angular/core';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import * as L from 'leaflet';
import { Store, DEALERS, HOME, dist } from '../store';
@Component({
  standalone: true, imports: [IonicModule],
  template: `
<ion-header><ion-toolbar color="dark"><ion-buttons slot="start"><ion-back-button defaultHref="/dashboard"></ion-back-button></ion-buttons><ion-title>Find a Dealer</ion-title></ion-toolbar>
<ion-toolbar><ion-searchbar placeholder="Search dealer" (ionInput)="q.set($any($event).target.value || '')"></ion-searchbar></ion-toolbar>
<ion-toolbar><ion-segment [value]="f()" (ionChange)="f.set($any($event).detail.value)"><ion-segment-button value="all">All</ion-segment-button><ion-segment-button value="mechanic">Mechanic</ion-segment-button><ion-segment-button value="towing">Towing</ion-segment-button><ion-segment-button value="tyre">Tyre</ion-segment-button></ion-segment></ion-toolbar></ion-header>
<ion-content>
  <p class="ion-padding-horizontal"><small>Simulated businesses. <a (click)="sort.set(sort()==='dist'?'eta':'dist')">Sort: {{ sort() }}</a> · <a (click)="showMap.set(!showMap())">{{ showMap() ? 'List only' : 'Show map' }}</a></small></p>
  <div id="dmap" [style.display]="showMap() ? 'block' : 'none'" style="height:42vh"></div>
  @if (list().length === 0) { <p class="ion-padding">No dealers match your search.</p> }
  @for (d of list(); track d.id) {
    <ion-card [style.border]="s.dealerId()===d.id ? '2px solid #f97316' : ''">
      <ion-card-header><ion-card-title>{{ d.name }}</ion-card-title><ion-card-subtitle>{{ d.area }} · {{ km(d) }} km · {{ d.eta }} min</ion-card-subtitle></ion-card-header>
      <ion-card-content>⭐ {{ d.rating }} ({{ d.reviews }}) · {{ d.open ? 'Open' : 'Closed' }} · {{ d.services.join(', ') }} · from KES {{ d.fee }}<br>
        <ion-button size="small" (click)="select(d.id)">{{ s.dealerId()===d.id ? '✔ Selected' : 'Select Dealer' }}</ion-button></ion-card-content>
    </ion-card>
  }
  @if (s.dealerId()) { <ion-button class="ion-margin" expand="block" color="warning" (click)="r.navigate(['/problem'])">Continue</ion-button> }
</ion-content>`,
})
export class DealersPage implements AfterViewInit, OnDestroy {
  s = inject(Store); r = inject(Router);
  q = signal(''); f = signal('all'); sort = signal<'dist' | 'eta'>('dist'); showMap = signal(true);
  map?: L.Map; layer = L.layerGroup();
  list = computed(() => DEALERS.filter(d => d.name.toLowerCase().includes(this.q().toLowerCase()) && (this.f() === 'all' || d.services.includes(this.f())))
    .sort((a, b) => this.sort() === 'dist' ? dist(HOME, a) - dist(HOME, b) : a.eta - b.eta));
  constructor() { effect(() => { this.list(); this.s.dealerId(); this.draw(); }); }
  km(d: any) { return dist(HOME, d).toFixed(1); }
  select(id: string) { this.s.dealerId.set(id); }
  ngAfterViewInit() {
    setTimeout(() => {
      try {
        this.map = L.map('dmap').setView([HOME.lat, HOME.lng], 13);
        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OpenStreetMap' }).addTo(this.map);
        this.layer.addTo(this.map); this.draw();
      } catch { this.showMap.set(false); }
    }, 100);
  }
  draw() {
    if (!this.map) return; this.layer.clearLayers();
    const ic = (e: string) => L.divIcon({ html: `<div style="font-size:24px">${e}</div>`, className: '', iconSize: [28, 28] });
    L.marker([HOME.lat, HOME.lng], { icon: ic('📍') }).bindPopup('You: Waiyaki Way').addTo(this.layer);
    for (const d of this.list()) {
      const el = document.createElement('div');
      el.innerHTML = `<b>${d.name}</b><br>⭐ ${d.rating} · ${d.eta} min<br>`;
      const b = document.createElement('button'); b.textContent = 'Select Dealer'; b.onclick = () => this.select(d.id); el.appendChild(b);
      L.marker([d.lat, d.lng], { icon: ic(this.s.dealerId() === d.id ? '🟠' : '🔧') }).bindPopup(el).addTo(this.layer);
    }
  }
  ngOnDestroy() { this.map?.remove(); }
}
