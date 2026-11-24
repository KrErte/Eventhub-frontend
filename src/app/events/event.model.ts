/** Mirrors the backend `EventResponse` record. */
export interface EventSummary {
  id: string;
  title: string;
  description: string | null;
  /** ISO-8601 instant, e.g. "2027-01-30T09:00:00Z". */
  startsAt: string;
  venue: string;
  capacity: number;
  /** Seats still free (capacity minus booked seats). */
  availableSeats: number;
}

/** Mirrors the backend `CreateEventRequest` record (body of `POST /api/events`). */
export interface CreateEventRequest {
  title: string;
  description: string | null;
  /** ISO-8601 instant. */
  startsAt: string;
  venue: string;
  capacity: number;
}
