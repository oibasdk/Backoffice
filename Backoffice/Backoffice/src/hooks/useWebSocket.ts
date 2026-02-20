/**
 * Typed WebSocket hook with auto-reconnect and exponential backoff.
 * - Strong TypeScript typing for messages
 * - Auto-reconnect with capped exponential backoff
 * - Cleanup on unmount
 * - Message validation (basic required fields)
 */
import { useCallback, useEffect, useRef, useState } from 'react';

export type WSSeverity = 'critical' | 'warning' | 'info';

export type AIInsightMessage = {
  id: string;
  severity: WSSeverity;
  title: string;
  summary: string;
  timestamp: string; // ISO
  meta?: Record<string, unknown>;
};

type UseWebSocketOptions = {
  url: string;
  protocols?: string | string[];
  onOpen?: () => void;
  onClose?: (ev?: CloseEvent) => void;
  onError?: (ev?: Event) => void;
  maxHistory?: number; // capped alert history
};

export const useWebSocket = (opts: UseWebSocketOptions) => {
  const { url, protocols, onOpen, onClose, onError, maxHistory = 200 } = opts;
  const wsRef = useRef<WebSocket | null>(null);
  const backoffRef = useRef<number>(500); // ms
  const reconnectTimer = useRef<number | null>(null);
  const mounted = useRef(true);

  const [connected, setConnected] = useState(false);
  const [history, setHistory] = useState<AIInsightMessage[]>([]);
  const [lastError, setLastError] = useState<string | null>(null);

  const validateMessage = useCallback((payload: unknown): payload is AIInsightMessage => {
    if (!payload || typeof payload !== 'object') return false;
    const p = payload as any;
    return typeof p.id === 'string' && typeof p.title === 'string' && typeof p.summary === 'string' && typeof p.timestamp === 'string' && ['critical', 'warning', 'info'].includes(p.severity);
  }, []);

  const connect = useCallback(() => {
    if (!mounted.current) return;
    try {
      wsRef.current = protocols ? new WebSocket(url, protocols) : new WebSocket(url);
      wsRef.current.onopen = () => {
        setConnected(true);
        backoffRef.current = 500;
        onOpen?.();
      };
      wsRef.current.onclose = (ev) => {
        setConnected(false);
        onClose?.(ev);
        // schedule reconnect
        if (!mounted.current) return;
        const delay = Math.min(backoffRef.current, 30_000);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        reconnectTimer.current = (window.setTimeout as any)(() => {
          backoffRef.current = Math.min(backoffRef.current * 1.8, 30_000);
          connect();
        }, delay);
      };
      wsRef.current.onerror = (ev) => {
        setLastError('WebSocket error');
        onError?.(ev);
      };
      wsRef.current.onmessage = (ev) => {
        try {
          const payload = JSON.parse(ev.data);
          if (validateMessage(payload)) {
            setHistory((h) => {
              const next = [payload, ...h].slice(0, maxHistory);
              return next;
            });
          } else {
            // ignore invalid messages
          }
        } catch (e) {
          // invalid json
        }
      };
    } catch (err) {
      setLastError((err as Error).message || String(err));
      // schedule reconnect
      const delay = Math.min(backoffRef.current, 30_000);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      reconnectTimer.current = (window.setTimeout as any)(() => {
        backoffRef.current = Math.min(backoffRef.current * 1.8, 30_000);
        connect();
      }, delay);
    }
  }, [url, protocols, onOpen, onClose, onError, validateMessage, maxHistory]);

  const send = useCallback((data: unknown) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data));
      return true;
    }
    return false;
  }, []);

  const close = useCallback(() => {
    mounted.current = false;
    if (reconnectTimer.current) {
      clearTimeout(reconnectTimer.current as number);
      reconnectTimer.current = null;
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setConnected(false);
  }, []);

  useEffect(() => {
    mounted.current = true;
    connect();
    return () => {
      mounted.current = false;
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      if (wsRef.current) wsRef.current.close();
      wsRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url]);

  return {
    connected,
    history,
    lastError,
    send,
    close,
  } as const;
};

export default useWebSocket;
