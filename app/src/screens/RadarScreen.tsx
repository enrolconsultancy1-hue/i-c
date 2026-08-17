import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { detectObstacles } from '../services/vision';
import { speak } from '../services/speech';
import { DetectedObject } from '../types';
import { colors, font } from '../theme';

const DIR_ICON: Record<DetectedObject['direction'], React.ComponentProps<typeof Ionicons>['name']> = {
  left: 'arrow-back',
  right: 'arrow-forward',
  ahead: 'arrow-up',
  behind: 'arrow-down',
};

export default function RadarScreen() {
  const { theme, mode, detail } = useApp();
  const c = colors[theme];
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const [objects, setObjects] = useState<DetectedObject[]>([]);
  const [busy, setBusy] = useState(false);

  const handleScan = async () => {
    if (busy) return;
    let image: string | undefined;
    try {
      const shot = await cameraRef.current?.takePictureAsync({ base64: true, quality: 0.5 });
      image = shot?.base64 ?? undefined;
    } catch {
      // ignore
    }
    if (!image) return;
    setBusy(true);
    try {
      const found = await detectObstacles(image);
      setObjects(found);
      if (found.length === 0) {
        speak('No obstacles detected nearby.', detail);
      } else {
        const summary = found.map((o) => `${o.name}, ${o.direction}, ${o.distanceM} meters`).join('. ');
        speak(summary, detail);
      }
    } catch {
      setObjects([]);
      speak('Scan failed. Check the API key in src/config.ts.', detail);
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: c.bg }]}>
      <View style={[styles.viewport, { backgroundColor: theme === 'dark' ? '#241F1A' : '#4C443A' }]}>
        {permission?.granted ? (
          <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing="back" />
        ) : (
          <View style={styles.placeholder}>
            <Text style={styles.phText}>Camera access needed to scan for obstacles.</Text>
            <TouchableOpacity onPress={requestPermission} accessibilityRole="button" style={[styles.permBtn, { backgroundColor: c.accent }]}>
              <Text style={[styles.permText, { color: c.accentInk }]}>Enable camera</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.body}>
        <Text style={[styles.title, { color: c.ink }]}>Objects nearby</Text>
        <Text style={[styles.subtitle, { color: c.inkMuted, fontFamily: font.mono }]}>
          {mode === 'indoor' ? 'INDOOR SCAN' : 'OUTDOOR SCAN'}
        </Text>

        {objects.map((o, i) => (
          <View key={o.id} style={[styles.row, { borderBottomColor: c.border }]}>
            <View style={[styles.icon, { backgroundColor: i === 0 ? c.accent : c.surface }]}>
              <Ionicons name={DIR_ICON[o.direction]} size={20} color={i === 0 ? '#FFFFFF' : c.ink} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.name, { color: c.ink }]}>{o.name}</Text>
              {o.note ? <Text style={[styles.note, { color: c.inkMuted }]}>{o.note}</Text> : null}
            </View>
            <Text style={[styles.dist, { color: c.ink, fontFamily: font.mono }]}>{o.distanceM} m</Text>
          </View>
        ))}

        {objects.length === 0 && !busy ? (
          <Text style={[styles.hint, { color: c.inkMuted }]}>
            Tap Scan to detect the objects and obstacles around you. Direction pans left / right through the headset.
          </Text>
        ) : null}

        <TouchableOpacity onPress={handleScan} disabled={busy} accessibilityRole="button" accessibilityLabel="Scan for obstacles" style={[styles.scanBtn, { backgroundColor: c.accent }]}>
          {busy ? (
            <ActivityIndicator color={c.accentInk} />
          ) : (
            <Ionicons name="radio-outline" size={22} color={c.accentInk} />
          )}
          <Text style={[styles.scanText, { color: c.accentInk }]}>{busy ? 'Scanning…' : 'Scan now'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  viewport: { height: 200, margin: 16, marginBottom: 0, borderRadius: 16, overflow: 'hidden' },
  placeholder: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 16 },
  phText: { color: '#FFFFFF', fontSize: 15, fontWeight: '600', textAlign: 'center', lineHeight: 22 },
  permBtn: { borderRadius: 12, paddingHorizontal: 24, paddingVertical: 14 },
  permText: { fontSize: 16, fontWeight: '800' },
  body: { padding: 16, paddingBottom: 28 },
  title: { fontSize: 26, fontWeight: '800', marginBottom: 4 },
  subtitle: { fontSize: 10, fontWeight: '700', letterSpacing: 1, marginBottom: 14 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth },
  icon: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  name: { fontSize: 16, fontWeight: '700' },
  note: { fontSize: 13, marginTop: 1 },
  dist: { fontSize: 13, fontWeight: '700' },
  hint: { fontSize: 12, lineHeight: 19, marginTop: 6 },
  scanBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, minHeight: 56, borderRadius: 12, marginTop: 16 },
  scanText: { fontSize: 17, fontWeight: '800' },
});
