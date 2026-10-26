import { Injectable, signal, effect } from '@angular/core';
export interface Dealer { id: string; name: string; lat: number; lng: number; area: string; phone: string; rating: number; reviews: number; services: string[]; eta: number; fee: number; open: boolean; }
export const HOME = { lat: -1.2635, lng: 36.7625 };
export const DEALERS: Dealer[] = [
  { id: 'd1', name: 'Westlands Auto Care', lat: -1.2676, lng: 36.8108, area: 'Westlands', phone: '+254 712 345 001', rating: 4.6, reviews: 212, services: ['mechanic', 'general'], eta: 25, fee: 500, open: true },
  { id: 'd2', name: 'ABC Motor Garage', lat: -1.2790, lng: 36.7700, area: 'Lavington', phone: '+254 722 345 002', rating: 4.3, reviews: 148, services: ['mechanic', 'tyre', 'general'], eta: 18, fee: 600, open: true },
  { id: 'd3', name: 'RoadReady Recovery', lat: -1.2580, lng: 36.7800, area: 'Kangemi', phone: '+254 733 345 003', rating: 4.8, reviews: 96, services: ['towing'], eta: 12, fee: 700, open: true },
  { id: 'd4', name: 'Kilimani Auto Clinic', lat: -1.2890, lng: 36.7870, area: 'Kilimani', phone: '+254 710 345 004', rating: 4.1, reviews: 87, services: ['mechanic', 'general'], eta: 30, fee: 500, open: false },
  { id: 'd5', name: 'Nairobi Tyre & Service Centre', lat: -1.2740, lng: 36.7480, area: 'Kangemi', phone: '+254 720 345 005', rating: 4.5, reviews: 175, services: ['tyre', 'general'], eta: 15, fee: 500, open: true },
  { id: 'd6', name: 'Express Roadside Assistance', lat: -1.2640, lng: 36.7990, area: 'Westlands', phone: '+254 700 345 006', rating: 4.4, reviews: 63, services: ['towing', 'mechanic', 'tyre'], eta: 20, fee: 550, open: true },
];
export const STAGES = ['Request submitted', 'Request accepted', 'Recovery driver assigned', 'Driver heading to pickup', 'Vehicle collected', 'Vehicle en route to garage', 'Vehicle arrived at garage', 'Inspection in progress', 'Quotation ready', 'Repair approved', 'Repair in progress', 'Quality inspection', 'Vehicle ready for collection'];
export const TASKS = ['Vehicle inspection completed', 'Tyre inspected', 'Puncture located', 'Tyre repaired', 'Tyre pressure checked', 'Final quality inspection completed'];
export const QUOTE = [{ n: 'Tyre puncture repair', a: 1500 }, { n: 'Labour', a: 500 }];
export interface Booking { ref: string; dealerId: string; category: string; description: string; pickup: string; destination: string; date: string; slot: string; notes: string; stage: number; progress: number; quote: 'pending' | 'approved' | 'declined'; repairStep: number; est: number; review?: { stars: number; text: string }; createdAt: string; }
export const dist = (a: { lat: number; lng: number }, b: { lat: number; lng: number }) => {
  const r = (x: number) => x * Math.PI / 180, dLa = r(b.lat - a.lat), dLo = r(b.lng - a.lng);
  const h = Math.sin(dLa / 2) ** 2 + Math.cos(r(a.lat)) * Math.cos(r(b.lat)) * Math.sin(dLo / 2) ** 2;
  return 12742 * Math.asin(Math.sqrt(h));
};
const load = (k: string, d: any) => { try { return JSON.parse(localStorage.getItem(k) || 'null') ?? d; } catch { return d; } };
@Injectable({ providedIn: 'root' })
export class Store {
  dealerId = signal<string | null>(load('dealer', null));
  draft = signal<any>(load('draft', { category: 'Tyre puncture', description: 'The front-right tyre has a puncture. I am parked safely along Waiyaki Way and cannot continue driving. I need the car collected and taken to the selected garage for inspection and repair.', drivable: 'No', safe: 'Yes', pickup: 'Waiyaki Way, Nairobi', assist: 'Pickup and repair' }));
  booking = signal<Booking | null>(load('booking', null));
  constructor() {
    effect(() => localStorage.setItem('dealer', JSON.stringify(this.dealerId())));
    effect(() => localStorage.setItem('draft', JSON.stringify(this.draft())));
    effect(() => localStorage.setItem('booking', JSON.stringify(this.booking())));
  }
  dealer() { return DEALERS.find(d => d.id === (this.booking()?.dealerId ?? this.dealerId())) ?? null; }
  estimate(d: Dealer) { return d.fee + 2000 + 800 + 1500; }
  create(date: string, slot: string, notes: string) {
    const d = this.dealer()!, f = this.draft();
    this.booking.set({ ref: 'RSA-' + Date.now().toString(36).toUpperCase().slice(-6), dealerId: d.id, category: f.category, description: f.description, pickup: f.pickup, destination: d.name + ', ' + d.area, date, slot, notes, stage: 0, progress: 0, quote: 'pending', repairStep: 0, est: this.estimate(d), createdAt: new Date().toISOString() });
  }
  patch(p: Partial<Booking>) { this.booking.update(b => b && { ...b, ...p }); }
  advance() {
    const b = this.booking(); if (!b) return;
    if (b.stage === 5) return this.patch({ stage: 6, progress: 1 });
    if (b.stage === 8 && b.quote !== 'approved') return;
    if (b.stage === 10 && b.repairStep < TASKS.length) { const s = b.repairStep + 1; return this.patch(s === TASKS.length ? { repairStep: s, stage: 11 } : { repairStep: s }); }
    if (b.stage < 12) this.patch({ stage: b.stage + 1 });
  }
  approve() { this.patch({ quote: 'approved', stage: 9 }); }
  decline() { this.patch({ quote: 'declined' }); }
  reset() { this.patch({ stage: 0, progress: 0, quote: 'pending', repairStep: 0, review: undefined }); }
}
