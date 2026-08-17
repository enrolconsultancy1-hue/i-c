import { API } from '../config';
import { DetailLevel, Mode } from '../types';
import { hasApi } from './api';

export interface StreamClient {
  sendFrame: (imageBase64: string, mode: Mode, detail: DetailLevel) => void;
  close: () => void;
}

function wsUrl(): string {
  const base = API.baseUrl.replace(/\/+$/, '');
  return base.replace(/^http/, 'ws') + '/api/v1/vision/stream';
}

const MAX_BACKOFF_MS = 15000;

/**
 * Open a WebSocket to the backend's continuous-narration endpoint with
 * auto-reconnect (exponential backoff, capped at 15s). `onNarration` fires for
 * each new scene description; `onError` for failures/reconnects. Call `close()`
 * to stop permanently — no further reconnect attempts.
 */
export function connectStream(
  onNarration: (text: string) => void,
  onError?: (message: string) => void,
): StreamClient {
  if (!hasApi()) {
    onError?.('Backend not configured — set API.baseUrl in src/config.ts');
    return { sendFrame: () => {}, close: () => {} };
  }

  let closed = false;
  let ws: WebSocket | null = null;
  let retryMs = 1000;
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

  const scheduleReconnect = () => {
    if (closed || reconnectTimer) return;
    reconnectTimer = setTimeout(() => {
      reconnectTimer = null;
      open();
    }, retryMs);
    retryMs = Math.min(retryMs * 2, MAX_BACKOFF_MS);
  };

  const open = () => {
    if (closed) return;
    ws = new WebSocket(wsUrl());
    ws.onopen = () => {
      retryMs = 1000;
    };
    ws.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data as string);
        if (msg?.type === 'narration' && typeof msg.text === 'string' && msg.text) {
          onNarration(msg.text);
        } else if (msg?.type === 'error') {
          onError?.(String(msg.message ?? 'stream error'));
        }
      } catch {
        // ignore malformed frames
      }
    };
    ws.onerror = () => {
      // onclose follows; reconnect is handled there
    };
    ws.onclose = () => {
      if (closed) return;
      onError?.('stream disconnected — reconnecting…');
      scheduleReconnect();
    };
  };

  open();

  return {
    sendFrame: (imageBase64, mode, detail) => {
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ image_base64: imageBase64, mode, detail }));
      }
    },
    close: () => {
      closed = true;
      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
        reconnectTimer = null;
      }
      try {
        ws?.close();
      } catch {
        // already closed
      }
      ws = null;
    },
  };
}
