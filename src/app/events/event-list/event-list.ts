import { DatePipe } from '@angular/common';
import { httpResource } from '@angular/common/http';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { EventSummary } from '../event.model';

@Component({
  selector: 'app-event-list',
  imports: [DatePipe, RouterLink],
  templateUrl: './event-list.html',
  styleUrl: './event-list.scss',
})
export class EventList {
  protected readonly events = httpResource<EventSummary[]>(() => '/api/events', {
    defaultValue: [],
  });
}
