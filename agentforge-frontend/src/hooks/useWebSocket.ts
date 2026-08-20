// src/hooks/useWebSocket.ts

import { useEffect, useRef, useState } from 'react';
import { useAuthStore } from '@/store/authStore';

// ─── Types ────────────────────────────────────────────────────
export interface WebSocketMessage {
  type: string;
  payload: unknown;
  timestamp?: string;
}

export interface UseWebSocketOptions {
  /** Whether the connection should be established (default: true) */
  enabled?: boolean;
  /** Whether to auto-reconnect on close (default: true) */
  reconnect?: boolean;
  /** Reconnection interval in ms (default: 3000) */
  reconnectInterval?: number;
}

// ─── Hook ─────────────────────────────────────────────────────
export function useWebSocket(
  path: string,
  options: UseWebSocketOptions = {}
) {
  const {
    enabled = true,
    reconnect = true,
    reconnectInterval = 3000,
  } = options;

  const accessToken = useAuthStore((s) => s.accessToken);

  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [connected, setConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);

  // ── Effect: manage socket lifecycle ────────────────────────
  useEffect(() => {
    if (!enabled || !accessToken) return;

    const wsBase = import.meta.env.VITE_WS_BASE_URL || 'ws://localhost:8000';
    const wsUrl = `${wsBase}${path}?token=${accessToken}`;

    const connect = () => {
      // Clear any pending reconnect timer
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }

      const socket = new WebSocket(wsUrl);
      socketRef.current = socket;

      socket.onopen = () => {
        setConnected(true);
      };

      socket.onclose = () => {
        setConnected(false);
        // Schedule reconnect if enabled
        if (reconnect) {
          reconnectTimerRef.current = setTimeout(connect, reconnectInterval);
        }
      };

      socket.onerror = () => {
        setConnected(false);
        // Note: onerror is followed by onclose, so we let onclose handle reconnect
      };

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data) as WebSocketMessage;
          setLastMessage(data);
        } catch {
          // Fallback for non-JSON messages
          setLastMessage({
            type: 'raw',
            payload: event.data,
          });
        }
      };
    };

    connect();

    // ── Cleanup ───────────────────────────────────────────────
    return () => {
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }
    };
  }, [path, accessToken, enabled, reconnect, reconnectInterval]);

  // ── Send method ─────────────────────────────────────────────
  const send = (message: unknown) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket is not open. Message not sent.');
    }
  };

  return {
    connected,
    lastMessage,
    send,
  };
}