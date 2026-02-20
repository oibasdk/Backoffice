// Feature flag utilities for UI transitions
export const useUIFeatures = () => {
  // Check if Tailwind UI shell should be used (defaults to false for safe rollout)
  const useTailwindShell =
    localStorage.getItem('feature:tailwind-shell') === 'true' ||
    new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '').get('tailwind-shell') === 'true';

  const useTailwindOverview =
    localStorage.getItem('feature:tailwind-overview') === 'true' ||
    new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '').get('tailwind-overview') === 'true';

  const setTailwindShell = (enabled: boolean) => {
    if (enabled) {
      localStorage.setItem('feature:tailwind-shell', 'true');
    } else {
      localStorage.removeItem('feature:tailwind-shell');
    }
    window.location.reload();
  };

  const setTailwindOverview = (enabled: boolean) => {
    if (enabled) {
      localStorage.setItem('feature:tailwind-overview', 'true');
    } else {
      localStorage.removeItem('feature:tailwind-overview');
    }
  };

  return {
    useTailwindShell,
    useTailwindOverview,
    setTailwindShell,
    setTailwindOverview
  };
};
