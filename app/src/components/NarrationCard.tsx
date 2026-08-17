import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useApp } from '../context/AppContext';
import { colors, font } from '../theme';

export default function NarrationCard() {
  const { theme, narration, describing } = useApp();
  const c = colors[theme];
  return (
    <View style={[styles.card, { backgroundColor: c.bg, borderColor: c.border }]}>
      <View style={styles.eyebrowRow}>
        <View style={[styles.liveDot, { backgroundColor: describing ? c.accent : c.success }]} />
        <Text style={[styles.eyebrow, { color: describing ? c.accentDeep : c.inkMuted, fontFamily: font.mono }]}>
          {describing ? 'DESCRIBING\u2026' : 'LIVE DESCRIPTION'}
        </Text>
      </View>
      <Text style={[styles.text, { color: describing ? c.inkMuted : c.ink }]}>
        {describing ? 'Reading the scene\u2026' : narration}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 16,
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    shadowColor: '#000',
    shadowOpacity: 0.22,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  eyebrowRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  liveDot: { width: 7, height: 7, borderRadius: 4 },
  eyebrow: { fontSize: 10, fontWeight: '700', letterSpacing: 1.2 },
  text: { fontSize: 17, lineHeight: 25, fontWeight: '500' },
});
