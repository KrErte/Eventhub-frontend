/** Mirrors the backend `EventResponse` record. */
export interface EventSummary {
  id: string;
  title: string;
  description: string | null;
  /** ISO-8601 instant, e.g. "2027-01-30T09:00:00Z". */
  startsAt: string;
  venue: string;
  capacity: number;
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

/** RFC 9457 problem details as returned by the API (`application/problem+json`). */
export interface ProblemDetail {
  title?: string;
  status?: number;
  detail?: string;
  /** Validation errors: field name → message. */
  errors?: Record<string, string>;
}
