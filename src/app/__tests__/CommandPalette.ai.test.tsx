import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CommandPalette } from '../shell/CommandPalette';
import { vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';

vi.mock('../../api/ai', () => ({
  queryAI: async (text: string) => ({ results: [{ title: 'Go to analytics', route: '/analytics', score: 0.9 }] }),
}));

// Mock react-i18next to avoid needing full i18n initialization
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (s: string) => s }),
}));

describe('CommandPalette AI suggestions', () => {
  it('shows AI suggestion when typing', async () => {
    render(
      <MemoryRouter>
        <CommandPalette
          open={true}
          onClose={() => {}}
          onOpen={() => {}}
          items={[]}
        />
      </MemoryRouter>
    );

    const input = screen.getByPlaceholderText(/command.hint/i);
    input.focus();
    // type using userEvent to ensure proper events are fired and debounced handlers run
    await userEvent.type(input, 'analytics');

    // AI suggestion should appear (debounced)
    await waitFor(() => expect(screen.getByText(/Go to analytics/)).toBeInTheDocument(), { timeout: 2000 });
  });
});
