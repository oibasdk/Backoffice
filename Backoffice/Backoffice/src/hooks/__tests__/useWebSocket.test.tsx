import { renderHook, act } from '@testing-library/react';
import useWebSocket from '../useWebSocket';

// This is a lightweight smoke test ensuring the hook exposes the expected API
// We cannot exercise a real WebSocket here; ensure mount/unmount doesn't throw

describe('useWebSocket smoke', () => {
  it('initializes and cleans up without error', () => {
    const { result, unmount } = renderHook(() => useWebSocket({ url: 'ws://localhost/test', maxHistory: 10 }));
    expect(result.current.connected).toBeDefined();
    expect(result.current.history).toBeDefined();
    expect(typeof result.current.send).toBe('function');
    unmount();
  });
});
