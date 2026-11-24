import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import {
  FieldTree,
  form,
  FormField,
  max,
  maxLength,
  min,
  required,
  submit,
  validate,
  ValidationError,
} from '@angular/forms/signals';
import { Router, RouterLink } from '@angular/router';
import { CreateEventRequest, ProblemDetail } from '../event.model';
import { EventService } from '../event.service';

/** Form model. `startsAt` is the raw `datetime-local` value (local time, e.g. "2027-05-01T18:00"). */
interface EventDraft {
  title: string;
  description: string;
  startsAt: string;
  venue: string;
  capacity: number | null;
}

const FIELD_NAMES = ['title', 'description', 'startsAt', 'venue', 'capacity'] as const;
type FieldName = (typeof FIELD_NAMES)[number];

const isFieldName = (name: string): name is FieldName =>
  (FIELD_NAMES as readonly string[]).includes(name);

@Component({
  selector: 'app-event-create',
  imports: [FormField, RouterLink],
  templateUrl: './event-create.html',
  styleUrl: './event-create.scss',
})
export class EventCreate {
  private readonly eventService = inject(EventService);
  private readonly router = inject(Router);

  private readonly model = signal<EventDraft>({
    title: '',
    description: '',
    startsAt: '',
    venue: '',
    capacity: null,
  });

  /** Client-side rules mirror the backend's CreateEventRequest validation. */
  protected readonly eventForm = form(this.model, (path) => {
    required(path.title, { message: 'Pealkiri on kohustuslik' });
    maxLength(path.title, 200, { message: 'Pealkiri võib olla kuni 200 märki' });

    maxLength(path.description, 2000, { message: 'Kirjeldus võib olla kuni 2000 märki' });

    required(path.startsAt, { message: 'Algusaeg on kohustuslik' });
    validate(path.startsAt, ({ value }) =>
      value() && new Date(value()).getTime() <= Date.now()
        ? { kind: 'past', message: 'Algusaeg peab olema tulevikus' }
        : undefined,
    );

    required(path.venue, { message: 'Toimumiskoht on kohustuslik' });
    maxLength(path.venue, 200, { message: 'Toimumiskoht võib olla kuni 200 märki' });

    required(path.capacity, { message: 'Kohtade arv on kohustuslik' });
    min(path.capacity, 1, { message: 'Kohtade arv peab olema vähemalt 1' });
    max(path.capacity, 100_000, { message: 'Kohtade arv võib olla kuni 100 000' });
  });

  /** Error that does not belong to a single field (e.g. server unavailable). */
  protected readonly formError = signal<string | null>(null);

  /** First error message of a field, shown only after the user has touched it (or tried to submit). */
  protected errorFor<T>(field: FieldTree<T>): string | null {
    const state = field();
    if (!state.touched() || !state.invalid()) {
      return null;
    }
    return state.errors()[0]?.message ?? null;
  }

  protected async save(event: SubmitEvent): Promise<void> {
    event.preventDefault();
    this.formError.set(null);

    await submit(this.eventForm, async (fields) => {
      try {
        await this.eventService.create(toRequest(fields().value()));
        await this.router.navigate(['/events']);
        return undefined;
      } catch (error) {
        return this.toSubmitErrors(error, fields);
      }
    });

    this.focusFirstInvalidField();
  }

  /** Maps a failed request to field errors (400 with `errors`) or a general form error. */
  private toSubmitErrors(
    error: unknown,
    fields: FieldTree<EventDraft>,
  ): ValidationError.WithOptionalFieldTree[] | undefined {
    if (error instanceof HttpErrorResponse && error.status === 400) {
      const problem = error.error as ProblemDetail | null;
      const fieldErrors = Object.entries(problem?.errors ?? {})
        .filter(([name]) => isFieldName(name))
        .map(([name, message]) => ({
          kind: 'server',
          message,
          fieldTree: fields[name as FieldName],
        }));
      if (fieldErrors.length > 0) {
        return fieldErrors;
      }
    }
    this.formError.set('Salvestamine ebaõnnestus. Proovi uuesti.');
    return undefined;
  }

  private focusFirstInvalidField(): void {
    const firstInvalid = FIELD_NAMES.map((name) => this.eventForm[name]()).find((state) =>
      state.invalid(),
    );
    firstInvalid?.focusBoundControl();
  }
}

function toRequest(draft: EventDraft): CreateEventRequest {
  return {
    title: draft.title.trim(),
    description: draft.description.trim() || null,
    // datetime-local has no time zone: interpret it in the user's zone and send UTC.
    startsAt: new Date(draft.startsAt).toISOString(),
    venue: draft.venue.trim(),
    capacity: draft.capacity ?? 0,
  };
}
