import { DetailLevel, DetectedObject, Direction, Mode } from '../types';
import { VISION } from '../config';
import { apiPost, hasApi } from './api';

// Mock narration used until a backend or API key is configured.
export const NARRATION: Record<Mode, Record<DetailLevel, string>> = {
  indoor: {
    brief: 'Living room. A sofa ahead, coffee table in front.',
    standard:
      "You're in a living room. A sofa is two meters ahead. A coffee table is directly in front of you, about half a meter. A doorway is to your right.",
    detailed:
      "You're in a living room. A sofa is two meters ahead, against the far wall. Directly in front of you, about half a meter, is a low coffee table — step around it to the left. A doorway into the kitchen is to your right. A floor lamp is in the far left corner.",
  },
  outdoor: {
    brief: 'Sidewalk ahead. A bench on your left, two meters.',
    standard:
      "You're on a sidewalk. A bench is two meters to your left. A crosswalk is straight ahead, about six meters. One person is passing on your right.",
    detailed:
      "You're standing on a concrete sidewalk. Two meters to your left there's a park bench with open space beside it. Straight ahead, about six meters, is a crosswalk with an audible signal pole. One person is passing you on your right and moving away. The curb edge is about one meter directly in front of you — step carefully.",
  },
};

type GeminiPart = { text?: string; inline_data?: { mime_type: string; data: string } };

function imagePart(b64: string): GeminiPart {
  return { inline_data: { mime_type: 'image/jpeg', data: b64 } };
}

async function geminiText(parts: GeminiPart[]): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${VISION.model}:generateContent?key=${VISION.apiKey}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents: [{ parts }] }),
  });
  if (!res.ok) throw new Error('Gemini HTTP ' + res.status);
  const json = await res.json();
  const text = (json?.candidates?.[0]?.content?.parts ?? [])
    .map((p: { text?: string }) => p.text ?? '')
    .join(' ')
    .trim();
  if (!text) throw new Error('Gemini returned no text');
  return text;
}

const PROMPTS: Record<Mode, string> = {
  indoor:
    'You are assisting a person who is blind or has low vision. Describe the indoor scene in practical spoken language: the room, furniture, objects, their positions and rough distances, and any hazards (steps, wet floor, obstacles).',
  outdoor:
    'You are assisting a person who is blind or has low vision navigating outdoors. Describe the scene for safety: the path ahead, obstacles, people, vehicles, curbs, crosswalks, and their positions/distances.',
};

const DETAIL_HINT: Record<DetailLevel, string> = {
  brief: 'Keep it to one short sentence.',
  standard: 'Give a normal-length description.',
  detailed: 'Give a thorough description with positions and distances.',
};

const OCR_PROMPT =
  'You are assisting a person who is blind or has low vision. Read ALL visible text in this image exactly as written, in natural reading order. Do not describe the image — only read the text. If there is no readable text, reply exactly: No text found.';

const RADAR_PROMPT =
  'You are assisting a person who is blind or has low vision. Detect the most important objects, obstacles, people and hazards in this image for safe navigation. Return ONLY a JSON object in this exact format (no markdown, no extra words): {"objects":[{"name":"chair","direction":"left","distanceM":2,"note":"low, trip hazard"}]}. "direction" must be one of: left, right, ahead, behind. "distanceM" is a rough estimate in meters. List up to 6 items, most important first.';

function normalizeDirection(d: unknown): Direction {
  const s = String(d ?? '').toLowerCase();
  if (s.includes('right')) return 'right';
  if (s.includes('left')) return 'left';
  if (s.includes('behind') || s.includes('back')) return 'behind';
  return 'ahead';
}

interface RawObject {
  name: string;
  direction: string;
  distanceM: number;
  note?: string;
}

/**
 * Scene description service.
 * Priority: backend proxy (API.baseUrl) → direct Gemini (dev fallback) → mock.
 */
export async function describeScene(
  detail: DetailLevel,
  offline: boolean,
  mode: Mode,
  imageBase64?: string,
): Promise<string> {
  if (hasApi() && imageBase64) {
    try {
      const r = await apiPost<{ text: string }>('/api/v1/vision/describe', {
        image_base64: imageBase64,
        mode,
        detail,
      });
      return r.text;
    } catch {
      // fall through
    }
  }
  if (VISION.apiKey && imageBase64) {
    try {
      return await geminiText([{ text: PROMPTS[mode] + ' ' + DETAIL_HINT[detail] }, imagePart(imageBase64)]);
    } catch {
      // fall through to mock on any failure
    }
  }
  await new Promise((r) => setTimeout(r, offline ? 500 : 900));
  return NARRATION[mode][detail];
}

/** OCR: read all visible text in a frame. */
export async function readTextFromImage(imageBase64: string): Promise<string> {
  if (hasApi()) {
    const r = await apiPost<{ text: string }>('/api/v1/vision/ocr', { image_base64: imageBase64 });
    return r.text;
  }
  if (!VISION.apiKey) throw new Error('No API key or backend configured');
  return geminiText([{ text: OCR_PROMPT }, imagePart(imageBase64)]);
}

/** Radar: detect obstacles with rough direction + distance. */
export async function detectObstacles(imageBase64: string): Promise<DetectedObject[]> {
  if (hasApi()) {
    const r = await apiPost<{ objects: RawObject[] }>('/api/v1/vision/radar', { image_base64: imageBase64 });
    return r.objects.slice(0, 6).map((o, i) => ({
      id: String(i + 1),
      name: String(o?.name ?? 'Object'),
      direction: normalizeDirection(o?.direction),
      distanceM: Number(o?.distanceM) > 0 ? Number(o.distanceM) : 1,
      note: o?.note ? String(o.note) : undefined,
    }));
  }
  if (!VISION.apiKey) throw new Error('No API key or backend configured');
  const raw = await geminiText([{ text: RADAR_PROMPT }, imagePart(imageBase64)]);
  const clean = raw.replace(/```json|```/g, '').trim();
  const start = clean.indexOf('{');
  const end = clean.lastIndexOf('}');
  const data = JSON.parse(clean.slice(start, end + 1));
  const objs = Array.isArray(data?.objects) ? data.objects : [];
  return objs.slice(0, 6).map((o: any, i: number) => ({
    id: String(i + 1),
    name: String(o?.name ?? 'Object'),
    direction: normalizeDirection(o?.direction),
    distanceM: Number(o?.distanceM) > 0 ? Number(o.distanceM) : 1,
    note: o?.note ? String(o.note) : undefined,
  }));
}
