import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { expectNoAxeViolations } from '../../../testing/axe';
import { EventCreate } from './event-create';

/** Lets pending promises (submit(), firstValueFrom) settle without waiting on open HTTP requests. */
const settle = () => new Promise((resolve) => setTimeout(resolve));

describe('EventCreate', () => {
  let fixture: ComponentFixture<EventCreate>;
  let el: HTMLElement;
  let httpMock: HttpTestingController;
  let router: Router;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      imports: [EventCreate],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    });
    httpMock = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);

    fixture = TestBed.createComponent(EventCreate);
    el = fixture.nativeElement as HTMLElement;
    await fixture.whenStable();
  });

  afterEach(() => httpMock.verify());

  function type(id: string, value: string) {
    const input = el.querySelector<HTMLInputElement | HTMLTextAreaElement>(`#${id}`)!;
    input.value = value;
    input.dispatchEvent(new Event('input'));
    input.dispatchEvent(new Event('blur'));
  }

  function fillValidForm() {
    type('title', 'Frontend meetup');
    type('description', 'Pitsa ja Angular');
    type('startsAt', '2099-05-01T18:00');
    type('venue', 'Tehnopol, Tallinn');
    type('capacity', '80');
  }

  async function submitForm() {
    el.querySelector<HTMLButtonElement>('button[type="submit"]')!.click();
    await settle();
    TestBed.tick();
  }

  describe('accessibility', () => {
    it('has no violations in the empty form', async () => {
      await expectNoAxeViolations(el);
    });

    it('has no violations while showing field errors', async () => {
      await submitForm();
      expect(el.querySelector('#title-error')).not.toBeNull();

      await expectNoAxeViolations(el);
      httpMock.expectNone('/api/events');
    });

    it('has no violations while showing a general error', async () => {
      fillValidForm();
      await submitForm();
      httpMock.expectOne('/api/events').flush(null, { status: 500, statusText: 'Server Error' });
      await settle();
      TestBed.tick();
      expect(el.querySelector('[role="alert"]')).not.toBeNull();

      await expectNoAxeViolations(el);
    });
  });

  it('links every input to a label', () => {
    for (const id of ['title', 'description', 'startsAt', 'venue', 'capacity']) {
      expect(el.querySelector(`label[for="${id}"]`), id).not.toBeNull();
    }
  });

  it('shows Estonian errors for empty required fields and does not call the API', async () => {
    await submitForm();

    expect(el.querySelector('#title-error')?.textContent).toContain('Pealkiri on kohustuslik');
    expect(el.querySelector('#startsAt-error')?.textContent).toContain('Algusaeg on kohustuslik');
    expect(el.querySelector('#venue-error')?.textContent).toContain('Toimumiskoht on kohustuslik');
    expect(el.querySelector('#capacity-error')?.textContent).toContain(
      'Kohtade arv on kohustuslik',
    );

    const title = el.querySelector('#title')!;
    expect(title.getAttribute('aria-invalid')).toBe('true');
    expect(title.getAttribute('aria-describedby')).toBe('title-error');
    expect(document.activeElement).toBe(title);

    httpMock.expectNone('/api/events');
  });

  it('rejects a start time in the past and capacity below 1', async () => {
    fillValidForm();
    type('startsAt', '2000-01-01T10:00');
    type('capacity', '0');
    await submitForm();

    expect(el.querySelector('#startsAt-error')?.textContent).toContain(
      'Algusaeg peab olema tulevikus',
    );
    expect(el.querySelector('#capacity-error')?.textContent).toContain('vähemalt 1');
    httpMock.expectNone('/api/events');
  });

  it('posts the event and returns to the list', async () => {
    fillValidForm();
    await submitForm();

    const req = httpMock.expectOne({ method: 'POST', url: '/api/events' });
    expect(req.request.body).toEqual({
      title: 'Frontend meetup',
      description: 'Pitsa ja Angular',
      startsAt: new Date('2099-05-01T18:00').toISOString(),
      venue: 'Tehnopol, Tallinn',
      capacity: 80,
    });
    req.flush({ id: '1', ...req.request.body }, { status: 201, statusText: 'Created' });
    await settle();

    expect(router.navigate).toHaveBeenCalledWith(['/events']);
  });

  it('shows server validation errors next to the matching field', async () => {
    fillValidForm();
    await submitForm();

    httpMock.expectOne('/api/events').flush(
      {
        title: 'Bad Request',
        status: 400,
        detail: 'Request validation failed',
        errors: { venue: 'Toimumiskoht võib olla kuni 200 märki' },
      },
      { status: 400, statusText: 'Bad Request' },
    );
    await settle();
    TestBed.tick();

    expect(el.querySelector('#venue-error')?.textContent).toContain('kuni 200 märki');
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('shows a general error when saving fails unexpectedly', async () => {
    fillValidForm();
    await submitForm();

    httpMock.expectOne('/api/events').flush(null, { status: 500, statusText: 'Server Error' });
    await settle();
    TestBed.tick();

    expect(el.querySelector('[role="alert"]')?.textContent).toContain('Salvestamine ebaõnnestus');
    expect(router.navigate).not.toHaveBeenCalled();
  });
});
