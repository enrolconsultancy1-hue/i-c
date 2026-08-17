# eye see — Wearable Smart-Glasses Roadmap

Goal: take the phone-based MVP and move it into a pair of smart glasses so guidance is always
on, hands-free, and eyes-forward.

## North-star experience

A pair of lightweight glasses with an outward camera, depth sensor, IMU, bone-conduction (or
open-ear) audio, and a mic. The user wears them like normal eyewear; eye see narrates the
environment through spatial audio — "obstacle ahead, one meter", "door on your right", "the
sign reads EXIT" — with a single touch or voice command to change detail level.

## Architecture target

```
┌────────────  Glasses  ────────────┐
│  RGB camera + ToF/depth + IMU     │
│  mic (voice) · bone-conduction spk│
│  touch pad / single button        │
└──────────────┬────────────────────┘
               │  BLE / WiFi (Phase 1)  →  on-device NPU (Phase 2+)
┌──────────────▼────────────────────┐
│  Edge compute: perception + safety│
│  Gemini (cloud) → YOLO/depth (edge)│
│  spatial-audio renderer (HRTF)    │
└──────────────┬────────────────────┘
               │
        phone app (config, nav, model mgmt)
```

## Phases

### Phase 0 — Phone MVP (current repo)
- ✅ Camera + Gemini narration, OCR, obstacle radar, GPS nav, TTS.
- ✅ **Continuous streaming bridge** — WebSocket `/api/v1/vision/stream` with latest-frame-wins
  coalescing + duplicate suppression; the app streams frames live ("Continuous narration").
- ✅ **Voice commands** — hands-free control via `expo-audio` recording + `/api/v1/speech/transcribe`
  (describe / read / radar / navigate / stop / home).
- ✅ **External camera source** — the app accepts a `CAMERA.captureUrl` (single-JPEG snapshot
  endpoint), so a stock WiFi camera on glasses needs only a config string, no native plugin.
- Next: validate the perception prompts and the "safety-first" narration style with real users.

### Phase 1 — Tethered glasses (prototype)
- Off-the-shelf smart-glasses dev kit **or** a DIY rig (ESP32-CAM + bone-conduction transducer on
  a glasses frame, ~$100–250 in parts).
- Glasses stream frames + IMU data over **BLE/WiFi** to the phone; the phone runs perception and
  streams audio back. Budget ~150–300 ms round-trip.
- Reuse the existing `app/` as the companion: configuration, navigation, model updates, battery.
- The streaming channel, voice pipeline, and external-camera source built in Phase 0 are exactly
  what the glasses will use — point `CAMERA.captureUrl` at the glasses camera and pair the audio.

### Phase 2 — Self-contained edge device
- Move perception on-device: **YOLO** object/obstacle detection, monocular **depth estimation**,
  on-device **OCR**, lightweight scene captioning, and on-device speech recognition.
- Compute options to evaluate: dedicated vision NPUs (Google Coral-style accelerators, Qualcomm
  or Jetson-class SoCs) vs. phone-tethered.
- **Spatial audio**: head-tracked binaural cues via IMU so "on your left" sounds left.

### Phase 3 — Consumer product
- Industrial design: < 60 g, all-day battery (target ≥ 8 h guidance), prescription-lens
  compatibility, water/dust resistance.
- Safety & compliance: low-power radio certs (FCC/CE), eye-safety for any display, data privacy
  (on-device by default), accessibility certification.
- Battery/thermal budget is the top risk — aggressive duty-cycling + edge inference.

## Key subsystems to build

| Subsystem | Now | Glasses |
|-----------|-----|---------|
| Capture | phone camera **or** external URL | RGB + ToF/depth + IMU + mic |
| Perception | Gemini (cloud, vision + speech) | YOLO + depth + OCR + on-device STT on NPU |
| Safety layer | prompt rules | deterministic hazard heuristics (proximity, motion) |
| Audio out | phone TTS | bone-conduction + spatial HRTF |
| Interaction | touch + voice | touch + voice + single button |
| Navigation | Google Maps | fused GPS/IMU + indoor positioning (BLE/UWB) |
| Power | n/a | duty-cycling, edge-first |

## Risks & open questions

1. **Latency** — real-time guidance needs < ~300 ms end-to-end. Mitigate with edge inference + duty-cycling.
2. **Battery/thermal** — vision is power-hungry; needs duty-cycling and efficient NPUs.
3. **Privacy** — an always-on camera + mic is sensitive. Default to on-device processing; make cloud opt-in.
4. **Depth accuracy** — monocular depth is approximate; evaluate ToF/LiDAR for the safety layer.
5. **Form factor** — balancing weight, battery and compute; start tethered, self-contain later.

## Recommended next concrete steps

1. User-test the phone MVP (continuous narration + voice commands) to lock the narration vocabulary.
2. Buy/flash an ESP32-CAM and set `CAMERA.captureUrl` — validate the external-camera path end-to-end.
3. Pick a glasses frame + bone-conduction transducer and assemble the Phase 1 tethered rig.
4. Port radar to on-device YOLO + depth; benchmark latency on a dev-kit NPU.
5. Prototype head-tracked spatial audio.
