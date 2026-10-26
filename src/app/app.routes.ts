import { Routes } from '@angular/router';
export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
  { path: 'dashboard', loadComponent: () => import('./pages/dashboard.page').then(m => m.DashboardPage) },
  { path: 'dealers', loadComponent: () => import('./pages/dealers.page').then(m => m.DealersPage) },
  { path: 'problem', loadComponent: () => import('./pages/problem.page').then(m => m.ProblemPage) },
  { path: 'schedule', loadComponent: () => import('./pages/schedule.page').then(m => m.SchedulePage) },
  { path: 'track', loadComponent: () => import('./pages/track.page').then(m => m.TrackPage) },
];
