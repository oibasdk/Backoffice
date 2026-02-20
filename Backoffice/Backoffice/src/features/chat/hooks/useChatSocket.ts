import { useEffect, useRef, useState } from "react";

type ChatSocketEvent = {
  type: string;
  message?: Record<string, any>;
  thread_id?: string;
};

type ChatSocketOptions = {
  threadId?: string | null;
  token?: string | null;
  onEvent?: (event: ChatSocketEvent) => void;
};

const resolveWsBase = () => {
  const envUrl = import.meta.env.VITE_CHAT_WS_URL as string | undefined;
  if (envUrl) {
    return envUrl.replace(/\/$/, "");
  }
  if (typeof window === "undefined") {
    return "";
  }
  const protocol = window.location.protocol === "https:" ? "wss" : "ws";
  return `${protocol}://${window.location.host}`;
};

export const useChatSocket = ({ threadId, token, onEvent }: ChatSocketOptions) => {
  const socketRef = useRef<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!threadId || !token) {
      return;
    }

    const wsBase = resolveWsBase();
    const wsUrl = `${wsBase}/ws/admin/chat/?token=${encodeURIComponent(token)}`;
    const socket = new WebSocket(wsUrl);
    socketRef.current = socket;

    socket.onopen = () => {
      setConnected(true);
      socket.send(JSON.stringify({ type: "join", thread_id: threadId }));
    };

    socket.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        onEvent?.(payload);
      } catch (err) {
        onEvent?.({ type: "error" });
      }
    };

    socket.onclose = () => {
      setConnected(false);
    };

    socket.onerror = () => {
      setConnected(false);
    };

    return () => {
      socket.close();
      socketRef.current = null;
      setConnected(false);
    };
  }, [threadId, token, onEvent]);

  const sendMessage = (content: string, attachments: Array<Record<string, any>> = []) => {
    if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
      return false;
    }
    socketRef.current.send(
      JSON.stringify({
        type: "message",
        content,
        attachments,
      })
    );
    return true;
  };

  const sendModeration = (messageId: string, action: string, reason?: string) => {
    if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
      return false;
    }
    socketRef.current.send(
      JSON.stringify({
        type: "moderate",
        message_id: messageId,
        action,
        reason,
      })
    );
    return true;
  };

  return { connected, sendMessage, sendModeration };
};
