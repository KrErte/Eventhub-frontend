import { DatePipe } from '@angular/common';
import { HttpErrorResponse, httpResource } from '@angular/common/http';
import { Component, computed, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BookingForm } from '../../bookings/booking-form/booking-form';
import { BookingResponse } from '../../bookings/booking.model';
import { EventSummary } from '../event.model';

@Component({
  selector: 'app-event-detail',
  imports: [DatePipe, RouterLink, BookingForm],
  templateUrl: './event-detail.html',
  styleUrl: './event-detail.scss',
})
export class EventDetail {
  /** Route parameter `:id` (bound via `withComponentInputBinding()`). */
  readonly id = input.required<string>();

  protected readonly event = httpResource<EventSummary>(
    () => `/api/events/${encodeURIComponent(this.id())}`,
  );

  protected readonly notFound = computed(() => {
    const error = this.event.error();
    return error instanceof HttpErrorResponse && error.status === 404;
  });

  /** Confirmation of the last booking, announced via the status live region. */
  protected readonly confirmation = signal<string | null>(null);

  protected hasStarted(event: EventSummary): boolean {
    return new Date(event.startsAt).getTime() <= Date.now();
  }

  protected onBooked(booking: BookingResponse): void {
    const seats = booking.seats === 1 ? '1 koht' : `${booking.seats} kohta`;
    this.confirmation.set(`Broneering tehtud: ${seats} (${booking.email}).`);
    this.event.reload();
  }
}
