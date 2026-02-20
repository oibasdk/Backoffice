import React from 'react';
import { render } from '@testing-library/react';
import AIInsightsTray from '../components/tailwind/AIInsightsTray';
import { runAxe } from '../setupAxe';

describe('AIInsightsTray accessibility (basic)', () => {
  it('has no obvious accessibility violations', async () => {
    const { container } = render(<AIInsightsTray open={true} onClose={() => {}} />);
    const results = await runAxe(container);
    expect(results.violations.length).toBe(0);
  }, 10000);
});
