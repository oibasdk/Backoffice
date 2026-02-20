import React from 'react';
import { CommandPalette } from './CommandPalette';

// Thin wrapper to reuse existing logic but allow Tailwind-specific styling later
export const CommandPaletteTailwind: React.FC<React.ComponentProps<typeof CommandPalette>> = (props) => {
  return <CommandPalette {...props} />;
};

export default CommandPaletteTailwind;
