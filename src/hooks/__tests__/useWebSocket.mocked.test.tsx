import { renderHook, act } from '@testing-library/react';
import useWebSocket from '../useWebSocket';

// Mock a simple WebSocket implementation that the hook can talk to
class MockWebSocket {
  static OPEN = 1;
  onopen: (() => void) | null = null;
  onmessage: ((ev: { data: string }) => void) | null = null;
  onclose: ((ev?: CloseEvent) => void) | null = null;
  onerror: ((ev?: Event) => void) | null = null;
  readyState = 0;
  url: string;
  constructor(url: string) {
    this.url = url;
    // emulate async open
    setTimeout(() => {
      this.readyState = MockWebSocket.OPEN;
      this.onopen && this.onopen();
    }, 10);
  }
  send(data: string) {
    // echo back after small delay
    setTimeout(() => {
      this.onmessage && this.onmessage({ data });
    }, 10);
  }
  close() {
    this.readyState = 3;
    this.onclose && this.onclose();
  }
}

describe('useWebSocket (mocked)', () => {
  const RealWebSocket = (global as any).WebSocket;

  beforeAll(() => {
    (global as any).WebSocket = MockWebSocket;
  });
  afterAll(() => {
    (global as any).WebSocket = RealWebSocket;
  });

  it('connects and receives messages', async () => {
    const { result, waitForNextUpdate, unmount } = renderHook(() =>
      useWebSocket({ url: 'ws://localhost/test', maxHistory: 5 })
    );

    // wait a bit for connection inside act
    await act(async () => {
      await new Promise((r) => setTimeout(r, 30));
    });
    expect(result.current.connected).toBe(true);

    // send a valid message through send (hook will echo it back in mock)
    await act(async () => {
      result.current.send({ id: 'm1', severity: 'info', title: 't', summary: 's', timestamp: new Date().toISOString() });
      // allow mock echo
      await new Promise((r) => setTimeout(r, 40));
    });

    expect(result.current.history.length).toBeGreaterThanOrEqual(1);
    expect(result.current.history[0].id).toBe('m1');

    // cleanup
    unmount();
  });
});
