import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { expectNoAxeViolations } from '../../../testing/axe';
import { BookingResponse } from '../booking.model';
import { BookingForm } from './booking-form';

/** Lets pending promises (submit(), firstValueFrom) settle without waiting on open HTTP requests. */
const settle = () => new Promise((resolve) => setTimeout(resolve));

describe('BookingForm', () => {
  let fixture: ComponentFixture<BookingForm>;
  let el: HTMLElement;
  let httpMock: HttpTestingController;
  let booked: BookingResponse[];

  beforeEach(async () => {
    TestBed.configureTestingModule({
      imports: [BookingForm],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    httpMock = TestBed.inject(HttpTestingController);

    fixture = TestBed.createComponent(BookingForm);
    fixture.componentRef.setInput('eventId', 'e1');
    fixture.componentRef.setInput('availableSeats', 3);
    booked = [];
    fixture.componentInstance.booked.subscribe((b) => booked.push(b));
    el = fixture.nativeElement as HTMLElement;
    await fixture.whenStable();
  });

  afterEach(() => httpMock.verify());

  function type(id: string, value: string) {
    const input = el.querySelector<HTMLInputElement>(`#${id}`)!;
    input.value = value;
    input.dispatchEvent(new Event('input'));
    input.dispatchEvent(new Event('blur'));
  }

  function fillValidForm(seats = '2') {
    type('booking-name', 'Mari Maasikas');
    type('booking-email', 'mari@example.com');
    type('booking-seats', seats);
  }

  async function submitForm() {
    el.querySelector<HTMLButtonElement>('button[type="submit"]')!.click();
    await settle();
    TestBed.tick();
  }

  function failWith(status: number, body: object | null) {
    httpMock
      .expectOne('/api/events/e1/bookings')
      .flush(body, { status, statusText: String(status) });
  }

  it('starts with one seat selected', () => {
    expect(el.querySelector<HTMLInputElement>('#booking-seats')!.value).toBe('1');
  });

  it('shows Estonian errors and focuses the first invalid field', async () => {
    type('booking-email', 'pole-e-post');
    await submitForm();

    expect(el.querySelector('#booking-name-error')?.textContent).toContain('Nimi on kohustuslik');
    expect(el.querySelector('#booking-email-error')?.textContent).toContain(
      'E-posti aadress ei ole korrektne',
    );
    expect(document.activeElement).toBe(el.querySelector('#booking-name'));
    httpMock.expectNone('/api/events/e1/bookings');
  });

  it('does not allow more seats than are available', async () => {
    fillValidForm('4');
    await submitForm();

    expect(el.querySelector('#booking-seats-error')?.textContent).toContain('Saadaval on 3 kohta');
    httpMock.expectNone('/api/events/e1/bookings');
  });

  it('books seats, emits the booking and clears the form', async () => {
    fillValidForm();
    await submitForm();

    const req = httpMock.expectOne({ method: 'POST', url: '/api/events/e1/bookings' });
    expect(req.request.body).toEqual({
      name: 'Mari Maasikas',
      email: 'mari@example.com',
      seats: 2,
    });
    const response: BookingResponse = {
      id: 'b1',
      eventId: 'e1',
      name: 'Mari Maasikas',
      email: 'mari@example.com',
      seats: 2,
      createdAt: '2026-11-24T10:00:00Z',
    };
    req.flush(response, { status: 201, statusText: 'Created' });
    await settle();
    TestBed.tick();

    expect(booked).toEqual([response]);
    expect(el.querySelector<HTMLInputElement>('#booking-name')!.value).toBe('');
    expect(el.querySelector('#booking-name-error')).toBeNull();
  });

  it('shows a duplicate e-mail conflict next to the e-mail field', async () => {
    fillValidForm();
    await submitForm();
    failWith(409, {
      status: 409,
      detail: 'Selle e-postiga on sellele sündmusele juba broneeritud',
      errors: { email: 'Selle e-postiga on sellele sündmusele juba broneeritud' },
    });
    await settle();
    TestBed.tick();

    expect(el.querySelector('#booking-email-error')?.textContent).toContain('juba broneeritud');
    expect(booked).toEqual([]);
  });

  it('shows the server message when seats ran out meanwhile', async () => {
    fillValidForm();
    await submitForm();
    failWith(409, {
      status: 409,
      detail: 'Vabu kohti pole piisavalt (alles 1)',
      availableSeats: 1,
    });
    await settle();
    TestBed.tick();

    expect(el.querySelector('[role="alert"]')?.textContent).toContain(
      'Vabu kohti pole piisavalt (alles 1)',
    );
  });

  it('shows a general error when the request fails unexpectedly', async () => {
    fillValidForm();
    await submitForm();
    failWith(500, null);
    await settle();
    TestBed.tick();

    expect(el.querySelector('[role="alert"]')?.textContent).toContain('Broneerimine ebaõnnestus');
  });

  describe('accessibility', () => {
    it('has no violations in the empty form', async () => {
      await expectNoAxeViolations(el);
    });

    it('has no violations while showing errors', async () => {
      await submitForm();
      await expectNoAxeViolations(el);
      httpMock.expectNone('/api/events/e1/bookings');
    });
  });
});
