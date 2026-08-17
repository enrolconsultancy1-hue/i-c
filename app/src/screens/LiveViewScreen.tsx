import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, DimensionValue } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useApp } from '../context/AppContext';
import { Mode } from '../types';
import { colors } from '../theme';
import { connectStream } from '../services/stream';
import { hasApi } from '../services/api';
import ModeToggle from '../components/ModeToggle';
import NarrationCard from '../components/NarrationCard';
import DescribeButton from '../components/DescribeButton';
import StreamToggle from '../components/StreamToggle';
import VoiceButton from '../components/VoiceButton';
import DetailSegmented from '../components/DetailSegmented';
import QuickActions from '../components/QuickActions';

// Demo detections — in production these come from the vision model.
const DETECTIONS: Record<Mode, { left: DimensionValue; top: DimensionValue; width: DimensionValue; height: DimensionValue; label: string }[]> = {
  indoor: [
    { left: '18%', top: '26%', width: '30%', height: '46%', label: 'SOFA' },
    { left: '32%', top: '70%', width: '34%', height: '9%', label: 'COFFEE TABLE' },
    { left: '74%', top: '40%', width: '18%', height: '42%', label: 'DOORWAY' },
  ],
  outdoor: [
    { left: '14%', top: '24%', width: '26%', height: '34%', label: 'BENCH' },
    { left: '62%', top: '40%', width: '24%', height: '46%', label: 'PERSON' },
    { left: '34%', top: '64%', width: '34%', height: '12%', label: 'CURB EDGE' },
  ],
};

const STREAM_INTERVAL_MS = 1600;
const SPEAK_MIN_GAP_MS = 3500;

export default function LiveViewScreen() {
  const { theme, mode, detail, describe, announce, streaming } = useApp();
  const c = colors[theme];
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);

  const modeRef = useRef(mode);
  modeRef.current = mode;
  const detailRef = useRef(detail);
  detailRef.current = detail;
  const announceRef = useRef(announce);
  announceRef.current = announce;

  const lastTextRef = useRef('');
  const lastAtRef = useRef(0);

  const handleDescribe = async () => {
    let image: string | undefined;
    try {
      const shot = await cameraRef.current?.takePictureAsync({ base64: true, quality: 0.4 });
      image = shot?.base64 ?? undefined;
    } catch {
      // if capture fails, describe without an image (falls back to mock)
    }
    await describe(image);
  };

  useEffect(() => {
    if (!streaming) return;

    if (!hasApi()) {
      announceRef.current('To use live narration, run the backend and set API.baseUrl in src/config.ts.');
      return;
    }

    const client = connectStream(
      (text) => {
        const now = Date.now();
        if (text === lastTextRef.current) return;
        if (now - lastAtRef.current < SPEAK_MIN_GAP_MS) return;
        lastTextRef.current = text;
        lastAtRef.current = now;
        announceRef.current(text);
      },
      () => {
        // connection errors are non-fatal in live mode; keep listening
      },
    );

    const timer = setInterval(async () => {
      try {
        const shot = await cameraRef.current?.takePictureAsync({ base64: true, quality: 0.35 });
        const frame = shot?.base64;
        if (frame) client.sendFrame(frame, modeRef.current, detailRef.current);
      } catch {
        // capture can fail mid-stream; skip this tick
      }
    }, STREAM_INTERVAL_MS);

    return () => {
      clearInterval(timer);
      client.close();
    };
  }, [streaming]);

  return (
    <View style={styles.root}>
      <ModeToggle />
      <View style={[styles.viewport, { backgroundColor: theme === 'dark' ? '#241F1A' : '#4C443A' }]}>
        {permission?.granted ? (
          <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing="back" />
        ) : (
          <View style={styles.placeholder}>
            <Text style={styles.phText}>Camera access needed to describe your surroundings.</Text>
            <TouchableOpacity
              onPress={requestPermission}
              accessibilityRole="button"
              style={[styles.permBtn, { backgroundColor: c.accent }]}
            >
              <Text style={[styles.permText, { color: c.accentInk }]}>Enable camera</Text>
            </TouchableOpacity>
          </View>
        )}

        {DETECTIONS[mode].map((d) => (
          <View
            key={d.label}
            style={[styles.det, { left: d.left, top: d.top, width: d.width, height: d.height, borderColor: c.signal }]}
          >
            <Text style={[styles.detTag, { backgroundColor: c.signal, color: c.signalInk }]}>{d.label}</Text>
          </View>
        ))}

        <NarrationCard />
      </View>

      <DetailSegmented />
      {streaming ? null : <DescribeButton onPress={handleDescribe} />}
      <StreamToggle />
      <VoiceButton onDescribe={handleDescribe} />
      <QuickActions />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  viewport: { flex: 1, margin: 16, marginTop: 12, marginBottom: 0, borderRadius: 16, overflow: 'hidden' },
  placeholder: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 16 },
  phText: { color: '#FFFFFF', fontSize: 15, fontWeight: '600', textAlign: 'center', lineHeight: 22 },
  permBtn: { borderRadius: 12, paddingHorizontal: 24, paddingVertical: 14 },
  permText: { fontSize: 16, fontWeight: '800' },
  det: { position: 'absolute', borderWidth: 2, borderRadius: 4 },
  detTag: {
    position: 'absolute',
    top: -22,
    left: -2,
    fontFamily: 'monospace',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
});
