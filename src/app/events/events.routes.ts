import { Routes } from '@angular/router';

export const EVENTS_ROUTES: Routes = [
  {
    path: '',
    title: 'Sündmused · EventHub',
    loadComponent: () => import('./event-list/event-list').then((m) => m.EventList),
  },
  {
    path: 'new',
    title: 'Lisa sündmus · EventHub',
    loadComponent: () => import('./event-create/event-create').then((m) => m.EventCreate),
  },
  {
    path: ':id',
    title: 'Sündmus · EventHub',
    loadComponent: () => import('./event-detail/event-detail').then((m) => m.EventDetail),
  },
];
