import { TestBed } from '@angular/core/testing';
import { expectNoAxeViolations } from '../../testing/axe';
import { DevLog } from './dev-log';
import { DEV_STAGES } from './dev-log.data';

describe('DevLog', () => {
  async function render() {
    TestBed.configureTestingModule({ imports: [DevLog] });
    const fixture = TestBed.createComponent(DevLog);
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
  }

  it('lists every stage in order with its commits', async () => {
    const el = await render();

    const stages = el.querySelectorAll('.stages > li');
    expect(stages).toHaveLength(DEV_STAGES.length);
    expect(stages[0].querySelector('h2')?.textContent).toContain('Git ja repod');

    const booking = Array.from(stages).find((s) => s.textContent?.includes('Broneerimine'))!;
    const link = booking.querySelector<HTMLAnchorElement>('a[href*="6ef44cc"]');
    expect(link?.href).toBe('https://github.com/KrErte/eventhub-api/commit/6ef44cc');
    expect(link?.target).toBe('_blank');
  });

  it('shows the current state and next steps', async () => {
    const el = await render();

    expect(el.querySelector('#state-heading')?.textContent).toContain('Seis praegu');
    expect(el.querySelector('#next-heading')?.textContent).toContain('Järgmised sammud');
  });

  it('has no accessibility violations', async () => {
    await expectNoAxeViolations(await render());
  });
});
