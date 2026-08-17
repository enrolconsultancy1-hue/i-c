import { File } from 'expo-file-system';
import { apiPost } from './api';

export type VoiceAction = 'describe' | 'read' | 'radar' | 'navigate' | 'stop' | 'home' | 'unknown';

export interface VoiceCommand {
  action: VoiceAction;
  raw: string;
}

/** Read a local recording into a base64 string. */
export async function fileToBase64(uri: string): Promise<string> {
  return await new File(uri).base64();
}

/** Guess an audio MIME type from the recording's file extension. */
export function mimeForUri(uri: string): string {
  const u = uri.toLowerCase();
  if (u.endsWith('.wav')) return 'audio/wav';
  if (u.endsWith('.webm')) return 'audio/webm';
  if (u.endsWith('.m4a') || u.endsWith('.mp4') || u.endsWith('.aac')) return 'audio/mp4';
  return 'audio/mp4';
}

/** Transcribe speech through the backend (Gemini audio). */
export async function transcribe(audioBase64: string, mimeType: string): Promise<string> {
  const r = await apiPost<{ text: string }>('/api/v1/speech/transcribe', {
    audio_base64: audioBase64,
    mime_type: mimeType,
  });
  return r.text;
}

/** Map a transcript to a simple voice command. */
export function parseCommand(text: string): VoiceCommand {
  const t = text.toLowerCase().trim();
  if (/(stop|quiet|pause|silence|shut up|be quiet)/.test(t)) return { action: 'stop', raw: text };
  if (/(read|text)/.test(t)) return { action: 'read', raw: text };
  if (/(radar|obstacle|hazard)/.test(t)) return { action: 'radar', raw: text };
  if (/(navigate|navigation|route|directions|take me|go to)/.test(t)) return { action: 'navigate', raw: text };
  if (/(home|live|camera|back)/.test(t)) return { action: 'home', raw: text };
  if (/(describe|what do you see|what.s around|look)/.test(t)) return { action: 'describe', raw: text };
  return { action: 'unknown', raw: text };
}
