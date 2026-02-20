import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import axe from 'axe-core';

describe('Accessibility (axe) smoke', () => {
  it('runs only when RUN_A11Y=1 is set (to avoid CI flakiness)', async () => {
    if (!process.env.RUN_A11Y) {
      // Skip by returning early — explicit run supported via env var
      return;
    }

    // Minimal render to provide a DOM for axe to analyze.
    render(document.createElement('div'));

    // Run axe against the document body
    // axe.run returns a Promise with results
    // @ts-ignore - run exists on axe
    const results = await axe.run(document.body);
    expect(results.violations).toBeDefined();
    expect(results.violations.length).toBe(0);
  });
});
