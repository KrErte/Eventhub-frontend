import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { BookingResponse, CreateBookingRequest } from './booking.model';

@Injectable({ providedIn: 'root' })
export class BookingService {
  private readonly http = inject(HttpClient);

  create(eventId: string, request: CreateBookingRequest): Promise<BookingResponse> {
    return firstValueFrom(
      this.http.post<BookingResponse>(
        `/api/events/${encodeURIComponent(eventId)}/bookings`,
        request,
      ),
    );
  }
}
