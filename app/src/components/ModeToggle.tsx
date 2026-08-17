import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useApp } from '../context/AppContext';
import { Mode } from '../types';
import { colors, font } from '../theme';

const MODES: Mode[] = ['indoor', 'outdoor'];

export default function ModeToggle() {
  const { theme, mode, setMode } = useApp();
  const c = colors[theme];

  return (
    <View style={styles.wrap}>
      <View style={[styles.seg, { backgroundColor: c.surface2 }]} accessibilityRole="tablist">
        {MODES.map((m) => {
          const active = m === mode;
          return (
            <TouchableOpacity
              key={m}
              onPress={() => setMode(m)}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              style={[styles.item, active && { backgroundColor: c.bg }]}
            >
              <Text style={[styles.label, { color: active ? c.ink : c.inkMuted, fontWeight: active ? '700' : '600' }]}>
                {m.charAt(0).toUpperCase() + m.slice(1)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
      <Text style={[styles.hint, { color: c.inkMuted, fontFamily: font.mono }]}>
        {mode === 'outdoor' ? 'OUTDOOR · GOOGLE MAPS ROUTING ON' : 'INDOOR · HOUSEHOLD ITEMS · NO MAPS'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: 16, paddingTop: 10 },
  seg: { flexDirection: 'row', gap: 6, borderRadius: 12, padding: 6 },
  item: { flex: 1, minHeight: 44, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  label: { fontSize: 14 },
  hint: { fontSize: 10, fontWeight: '700', letterSpacing: 0.6, marginTop: 6, marginLeft: 2 },
});
