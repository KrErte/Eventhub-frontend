import { Routes } from '@angular/router';

export const EVENTS_ROUTES: Routes = [
  {
    path: '',
    title: 'Sündmused · EventHub',
    loadComponent: () => import('./event-list/event-list').then((m) => m.EventList),
  },
];
