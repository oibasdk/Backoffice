import React from 'react';
import { render, screen } from '@testing-library/react';
import AIInsightsTray from '../AIInsightsTray';
import { vi } from 'vitest';

vi.mock('../../../hooks/useWebSocket', () => {
  return {
    __esModule: true,
    default: () => ({
      connected: true,
      history: [
        {
          id: '1',
          severity: 'critical',
          title: 'Critical issue',
          summary: 'Something broke',
          timestamp: new Date().toISOString(),
          meta: { icon: 'mdi:alert-circle' },
        },
        {
          id: '2',
          severity: 'info',
          title: 'Info event',
          summary: 'For visibility',
          timestamp: new Date(Date.now() - 1000 * 60).toISOString(),
        },
      ],
      lastError: null,
      send: () => true,
      close: () => {},
    }),
  };
});

vi.mock('../../../api/ai', () => ({ useAIAnomalies: () => ({ data: [], isLoading: false }) }));

describe('AIInsightsTray', () => {
  it('renders live insights when open', () => {
    render(<AIInsightsTray open={true} onClose={() => {}} />);
    expect(screen.getByText(/AI Insights/i)).toBeInTheDocument();
    expect(screen.getByText(/Critical issue/)).toBeInTheDocument();
  });

  it('shows empty state when no insights', () => {
    vi.mocked(require('../../../hooks/useWebSocket').default).mockImplementation(() => ({
      connected: false,
      history: [],
      lastError: null,
      send: () => false,
      close: () => {},
    }));

    render(<AIInsightsTray open={true} onClose={() => {}} />);
    expect(screen.getByText(/No insights at the moment/i)).toBeInTheDocument();
  });
});
