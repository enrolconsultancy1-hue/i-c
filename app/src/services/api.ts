import { API } from '../config';

/** True when a backend is configured (preferred over direct/dev keys). */
export function hasApi(): boolean {
  return API.baseUrl.trim().length > 0;
}

export function apiUrl(path: string): string {
  return API.baseUrl.replace(/\/+$/, '') + path;
}

export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(apiUrl(path), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error('API HTTP ' + res.status);
  return (await res.json()) as T;
}

export async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(apiUrl(path));
  if (!res.ok) throw new Error('API HTTP ' + res.status);
  return (await res.json()) as T;
}
