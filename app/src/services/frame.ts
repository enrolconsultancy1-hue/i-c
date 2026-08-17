/**
 * Fetch a single JPEG frame from an external camera (Phase 1 glasses prep) and
 * return it base64-encoded (no data-URI prefix). Works with any endpoint that
 * returns one JPEG per request — e.g. an ESP32-CAM `/capture` route.
 */
export async function fetchFrameBase64(url: string): Promise<string> {
  const res = await fetch(url);
  if (!res.ok) throw new Error('camera HTTP ' + res.status);
  const blob = await res.blob();
  const dataUrl: string = await new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(fr.result as string);
    fr.onerror = () => reject(new Error('could not read camera frame'));
    fr.readAsDataURL(blob);
  });
  const comma = dataUrl.indexOf(',');
  return comma >= 0 ? dataUrl.slice(comma + 1) : dataUrl;
}
