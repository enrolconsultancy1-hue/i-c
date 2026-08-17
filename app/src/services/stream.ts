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

/**
 * Open a WebSocket to the backend's continuous-narration endpoint.
 * `onNarration` fires for each new scene description; `onError` for failures.
 */
export function connectStream(
  onNarration: (text: string) => void,
  onError?: (message: string) => void,
): StreamClient {
  if (!hasApi()) {
    onError?.('Backend not configured — set API.baseUrl in src/config.ts');
    return { sendFrame: () => {}, close: () => {} };
  }

  const ws = new WebSocket(wsUrl());
  let closed = false;

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
    if (!closed) onError?.('stream connection error');
  };
  ws.onclose = () => {
    if (!closed) onError?.('stream disconnected');
  };

  return {
    sendFrame: (imageBase64, mode, detail) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ image_base64: imageBase64, mode, detail }));
      }
    },
    close: () => {
      closed = true;
      try {
        ws.close();
      } catch {
        // already closed
      }
    },
  };
}
