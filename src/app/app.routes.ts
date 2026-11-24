import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'events' },
  {
    path: 'events',
    loadChildren: () => import('./events/events.routes').then((m) => m.EVENTS_ROUTES),
  },
  {
    path: 'arendus',
    title: 'Arenduse käik · EventHub',
    loadComponent: () => import('./dev-log/dev-log').then((m) => m.DevLog),
  },
  { path: '**', redirectTo: 'events' },
];
