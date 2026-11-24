import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { CreateEventRequest, EventSummary } from './event.model';

/** Write operations for events. Reads use `httpResource()` in components. */
@Injectable({ providedIn: 'root' })
export class EventService {
  private readonly http = inject(HttpClient);

  create(request: CreateEventRequest): Promise<EventSummary> {
    return firstValueFrom(this.http.post<EventSummary>('/api/events', request));
  }
}
