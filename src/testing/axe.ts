import axe from 'axe-core';

/**
 * Runs axe-core (WCAG 2.x A/AA + best practices) on a rendered element and fails the test on violations.
 *
 * `color-contrast` is disabled because jsdom does not render styles; contrast is ensured by the colour
 * tokens in `src/styles.scss` and checked in a real browser.
 */
export async function expectNoAxeViolations(element: Element): Promise<void> {
  const results = await axe.run(element, {
    runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'] },
    rules: {
      'color-contrast': { enabled: false },
      // Component tests render a fragment, not a whole page: page-level landmark rules do not apply.
      region: { enabled: false },
      'landmark-one-main': { enabled: false },
      'page-has-heading-one': { enabled: false },
    },
  });

  const report = results.violations.map(
    (violation) =>
      `${violation.id} (${violation.impact}): ${violation.help}\n` +
      violation.nodes.map((node) => `    ${node.target.join(' ')}`).join('\n'),
  );
  expect(report, 'axe accessibility violations').toEqual([]);
}
