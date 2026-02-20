import axe from 'axe-core';

// Lightweight helper to run axe in tests manually if desired.
export async function runAxe(container: Element) {
  // axe-core usage in Node requires a browser-like environment; this helper is a placeholder
  // For CI, consider using `axe-playwright` or `axe-core` in a headless browser.
  return axe.run(container as any);
}
