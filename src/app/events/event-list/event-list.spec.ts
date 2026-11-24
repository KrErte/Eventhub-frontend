import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { EventSummary } from '../event.model';
import { EventList } from './event-list';

describe('EventList', () => {
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [EventList],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  async function render(respond: (url: string) => void) {
    const fixture = TestBed.createComponent(EventList);
    TestBed.tick();
    respond('/api/events');
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
  }

  it('shows a loading message before data arrives', async () => {
    const fixture = TestBed.createComponent(EventList);
    TestBed.tick();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('[role="status"]')?.textContent).toContain('Laadin');

    httpMock.expectOne('/api/events').flush([]);
  });

  it('lists events from the API', async () => {
    const events: EventSummary[] = [
      {
        id: '1',
        title: 'Tartu talvine jooks',
        description: null,
        startsAt: '2027-01-30T09:00:00Z',
        venue: 'Raekoja plats, Tartu',
        capacity: 1500,
      },
      {
        id: '2',
        title: 'Frontend meetup',
        description: 'Angulari õhtu',
        startsAt: '2027-02-11T16:00:00Z',
        venue: 'Tehnopol, Tallinn',
        capacity: 80,
      },
    ];

    const el = await render((url) => httpMock.expectOne(url).flush(events));

    const items = el.querySelectorAll('li');
    expect(items).toHaveLength(2);
    expect(items[0].querySelector('h2')?.textContent).toContain('Tartu talvine jooks');
    expect(items[0].textContent).toContain('Raekoja plats, Tartu');
    expect(items[0].textContent).toContain('1500');
    expect(items[0].querySelector('time')?.getAttribute('datetime')).toBe('2027-01-30T09:00:00Z');
    expect(items[1].textContent).toContain('Angulari õhtu');
  });

  it('shows an empty state when there are no events', async () => {
    const el = await render((url) => httpMock.expectOne(url).flush([]));

    expect(el.querySelector('li')).toBeNull();
    expect(el.textContent).toContain('Sündmusi pole');
  });

  it('shows an error message when the request fails', async () => {
    const el = await render((url) =>
      httpMock.expectOne(url).flush(null, { status: 500, statusText: 'Server Error' }),
    );

    expect(el.querySelector('[role="alert"]')?.textContent).toContain(
      'Sündmuste laadimine ebaõnnestus',
    );
  });
});
