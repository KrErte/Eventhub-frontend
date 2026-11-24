import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, input, output, signal } from '@angular/core';
import {
  email,
  form,
  FormField,
  max,
  maxLength,
  min,
  required,
  submit,
} from '@angular/forms/signals';
import { fieldError, problemOf, serverFieldErrors } from '../../shared/form-errors';
import { BookingResponse, CreateBookingRequest } from '../booking.model';
import { BookingService } from '../booking.service';

interface BookingDraft {
  name: string;
  email: string;
  seats: number | null;
}

const FIELD_NAMES = ['name', 'email', 'seats'] as const;
const MAX_SEATS_PER_BOOKING = 10;

const emptyDraft = (): BookingDraft => ({ name: '', email: '', seats: 1 });
const seatsText = (n: number) => (n === 1 ? '1 koht' : `${n} kohta`);

@Component({
  selector: 'app-booking-form',
  imports: [FormField],
  templateUrl: './booking-form.html',
  styleUrl: './booking-form.scss',
})
export class BookingForm {
  readonly eventId = input.required<string>();
  readonly availableSeats = input.required<number>();
  /** Emitted after a successful booking. */
  readonly booked = output<BookingResponse>();

  private readonly bookingService = inject(BookingService);

  protected readonly maxSeats = computed(() =>
    Math.min(MAX_SEATS_PER_BOOKING, this.availableSeats()),
  );

  private readonly model = signal<BookingDraft>(emptyDraft());

  /** Client-side rules mirror the backend's CreateBookingRequest validation. */
  protected readonly bookingForm = form(this.model, (path) => {
    required(path.name, { message: 'Nimi on kohustuslik' });
    maxLength(path.name, 200, { message: 'Nimi võib olla kuni 200 märki' });

    required(path.email, { message: 'E-post on kohustuslik' });
    email(path.email, { message: 'E-posti aadress ei ole korrektne' });

    required(path.seats, { message: 'Kohtade arv on kohustuslik' });
    min(path.seats, 1, { message: 'Broneerida tuleb vähemalt 1 koht' });
    max(path.seats, () => this.maxSeats(), {
      message: () =>
        this.availableSeats() < MAX_SEATS_PER_BOOKING
          ? `Saadaval on ${seatsText(this.availableSeats())}`
          : `Korraga saab broneerida kuni ${MAX_SEATS_PER_BOOKING} kohta`,
    });
  });

  /** Error that does not belong to a single field (e.g. seats ran out, server unavailable). */
  protected readonly formError = signal<string | null>(null);

  protected readonly errorFor = fieldError;

  protected async save(event: SubmitEvent): Promise<void> {
    event.preventDefault();
    this.formError.set(null);

    await submit(this.bookingForm, async (fields) => {
      try {
        const booking = await this.bookingService.create(
          this.eventId(),
          toRequest(fields().value()),
        );
        this.model.set(emptyDraft());
        this.bookingForm().reset();
        this.booked.emit(booking);
        return undefined;
      } catch (error) {
        const fieldErrors = serverFieldErrors(error, fields, FIELD_NAMES);
        if (fieldErrors.length > 0) {
          return fieldErrors;
        }
        const conflict = error instanceof HttpErrorResponse && error.status === 409;
        this.formError.set(
          (conflict && problemOf(error)?.detail) || 'Broneerimine ebaõnnestus. Proovi uuesti.',
        );
        return undefined;
      }
    });

    this.focusFirstInvalidField();
  }

  private focusFirstInvalidField(): void {
    FIELD_NAMES.map((name) => this.bookingForm[name]())
      .find((state) => state.touched() && state.invalid())
      ?.focusBoundControl();
  }
}

function toRequest(draft: BookingDraft): CreateBookingRequest {
  return { name: draft.name.trim(), email: draft.email.trim(), seats: draft.seats ?? 0 };
}
