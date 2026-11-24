/** Mirrors the backend `CreateBookingRequest` record (body of `POST /api/events/{id}/bookings`). */
export interface CreateBookingRequest {
  name: string;
  email: string;
  seats: number;
}

/** Mirrors the backend `BookingResponse` record. */
export interface BookingResponse {
  id: string;
  eventId: string;
  name: string;
  email: string;
  seats: number;
  /** ISO-8601 instant. */
  createdAt: string;
}
