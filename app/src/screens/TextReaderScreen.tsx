import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { readTextFromImage } from '../services/vision';
import { speak, stopSpeaking } from '../services/speech';
import { colors } from '../theme';

export default function TextReaderScreen() {
  const { theme, detail } = useApp();
  const c = colors[theme];
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const [result, setResult] = useState('');
  const [busy, setBusy] = useState(false);

  const handleRead = async () => {
    if (busy) return;
    let image: string | undefined;
    try {
      const shot = await cameraRef.current?.takePictureAsync({ base64: true, quality: 0.6 });
      image = shot?.base64 ?? undefined;
    } catch {
      // ignore capture failures
    }
    if (!image) {
      setResult('Could not capture the camera frame. Tap Read to try again.');
      return;
    }
    setBusy(true);
    setResult('');
    try {
      const text = await readTextFromImage(image);
      setResult(text);
      speak(text, detail);
    } catch {
      setResult('Could not read text. Check the API key in src/config.ts.');
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
            <Text style={styles.phText}>Camera access needed to read text.</Text>
            <TouchableOpacity onPress={requestPermission} accessibilityRole="button" style={[styles.permBtn, { backgroundColor: c.accent }]}>
              <Text style={[styles.permText, { color: c.accentInk }]}>Enable camera</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.body}>
        <Text style={[styles.title, { color: c.ink }]}>Text reader</Text>

        <View style={[styles.card, { backgroundColor: c.surface, borderColor: c.borderStrong }]}>
          {busy ? (
            <View style={styles.busyRow}>
              <ActivityIndicator color={c.accent} />
              <Text style={[styles.reading, { color: c.inkMuted }]}>Reading…</Text>
            </View>
          ) : result ? (
            <Text style={[styles.result, { color: c.ink }]}>{result}</Text>
          ) : (
            <Text style={[styles.hint, { color: c.inkMuted }]}>
              Point the camera at a sign, menu, label, or document, then tap Read aloud.
            </Text>
          )}
        </View>

        <TouchableOpacity onPress={handleRead} disabled={busy} accessibilityRole="button" accessibilityLabel="Read text aloud" style={[styles.readBtn, { backgroundColor: c.accent }]}>
          <Ionicons name="book-outline" size={22} color={c.accentInk} />
          <Text style={[styles.readText, { color: c.accentInk }]}>{busy ? 'Reading…' : 'Read aloud'}</Text>
        </TouchableOpacity>

        {result && !busy ? (
          <TouchableOpacity onPress={() => stopSpeaking()} accessibilityRole="button" style={[styles.stop, { backgroundColor: c.surface, borderColor: c.borderStrong }]}>
            <Text style={[styles.stopText, { color: c.ink }]}>Stop speaking</Text>
          </TouchableOpacity>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  viewport: { height: 240, margin: 16, marginBottom: 0, borderRadius: 16, overflow: 'hidden' },
  placeholder: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 16 },
  phText: { color: '#FFFFFF', fontSize: 15, fontWeight: '600', textAlign: 'center', lineHeight: 22 },
  permBtn: { borderRadius: 12, paddingHorizontal: 24, paddingVertical: 14 },
  permText: { fontSize: 16, fontWeight: '800' },
  body: { padding: 16, paddingBottom: 28 },
  title: { fontSize: 26, fontWeight: '800', marginBottom: 14 },
  card: { borderRadius: 14, borderWidth: 1.5, padding: 16, minHeight: 120 },
  busyRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8 },
  reading: { fontSize: 15, fontWeight: '600' },
  result: { fontSize: 17, lineHeight: 26, fontWeight: '500' },
  hint: { fontSize: 14, lineHeight: 22 },
  readBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, minHeight: 56, borderRadius: 12, marginTop: 14 },
  readText: { fontSize: 17, fontWeight: '800' },
  stop: { alignItems: 'center', justifyContent: 'center', minHeight: 52, borderRadius: 12, borderWidth: 1.5, marginTop: 10 },
  stopText: { fontSize: 15, fontWeight: '700' },
});
