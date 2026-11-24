import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { expectNoAxeViolations } from '../../../testing/axe';
import { BookingResponse } from '../../bookings/booking.model';
import { EventSummary } from '../event.model';
import { EventDetail } from './event-detail';

const settle = () => new Promise((resolve) => setTimeout(resolve));

const future = (seats: number): EventSummary => ({
  id: 'e1',
  title: 'Frontend meetup',
  description: 'Pitsa ja Angular',
  startsAt: '2099-02-11T16:00:00Z',
  venue: 'Tehnopol, Tallinn',
  capacity: 80,
  availableSeats: seats,
});

describe('EventDetail', () => {
  let fixture: ComponentFixture<EventDetail>;
  let el: HTMLElement;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [EventDetail],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    });
    httpMock = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(EventDetail);
    fixture.componentRef.setInput('id', 'e1');
    el = fixture.nativeElement as HTMLElement;
  });

  afterEach(() => httpMock.verify());

  async function render(respond: () => void) {
    TestBed.tick();
    respond();
    await fixture.whenStable();
  }

  const respondWith = (event: EventSummary) => () =>
    httpMock.expectOne('/api/events/e1').flush(event);

  it('shows the event with free seats and a booking form', async () => {
    await render(respondWith(future(12)));

    expect(el.querySelector('h1')?.textContent).toContain('Frontend meetup');
    expect(el.textContent).toContain('Tehnopol, Tallinn');
    expect(el.textContent).toContain('Pitsa ja Angular');
    expect(el.querySelector('.availability')?.textContent).toContain('12 / 80 kohta vaba');
    expect(el.querySelector('app-booking-form')).not.toBeNull();
  });

  it('hides the booking form when the event is sold out', async () => {
    await render(respondWith(future(0)));

    expect(el.querySelector('.availability')?.textContent).toContain('Välja müüdud');
    expect(el.querySelector('app-booking-form')).toBeNull();
  });

  it('hides the booking form for an event that has already started', async () => {
    await render(respondWith({ ...future(10), startsAt: '2000-01-01T10:00:00Z' }));

    expect(el.textContent).toContain('Sündmus on juba toimunud');
    expect(el.querySelector('app-booking-form')).toBeNull();
  });

  it('shows "not found" for an unknown event', async () => {
    await render(() =>
      httpMock.expectOne('/api/events/e1').flush(null, { status: 404, statusText: 'Not Found' }),
    );

    expect(el.querySelector('h1')?.textContent).toContain('Sündmust ei leitud');
    expect(el.querySelector('a[href="/events"]')).not.toBeNull();
  });

  it('offers a retry when loading fails', async () => {
    await render(() =>
      httpMock.expectOne('/api/events/e1').flush(null, { status: 500, statusText: 'Error' }),
    );
    expect(el.querySelector('[role="alert"]')?.textContent).toContain('laadimine ebaõnnestus');

    el.querySelector<HTMLButtonElement>('button.retry')!.click();
    TestBed.tick();
    httpMock.expectOne('/api/events/e1').flush(future(5));
    await fixture.whenStable();

    expect(el.querySelector('h1')?.textContent).toContain('Frontend meetup');
  });

  it('confirms a booking and reloads the free seats', async () => {
    await render(respondWith(future(12)));

    const booking: BookingResponse = {
      id: 'b1',
      eventId: 'e1',
      name: 'Mari',
      email: 'mari@example.com',
      seats: 2,
      createdAt: '2026-11-24T10:00:00Z',
    };
    fixture.componentInstance['onBooked'](booking);
    TestBed.tick();
    httpMock.expectOne('/api/events/e1').flush(future(10));
    await settle();
    await fixture.whenStable();

    expect(el.querySelector('.confirmation')?.textContent).toContain('Broneering tehtud: 2 kohta');
    expect(el.querySelector('.availability')?.textContent).toContain('10 / 80 kohta vaba');
  });

  describe('accessibility', () => {
    it('has no violations with an event and booking form', async () => {
      await render(respondWith(future(12)));
      await expectNoAxeViolations(el);
    });

    it('has no violations when sold out', async () => {
      await render(respondWith(future(0)));
      await expectNoAxeViolations(el);
    });

    it('has no violations when not found', async () => {
      await render(() =>
        httpMock.expectOne('/api/events/e1').flush(null, { status: 404, statusText: 'Not Found' }),
      );
      await expectNoAxeViolations(el);
    });
  });
});
