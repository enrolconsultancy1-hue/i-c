import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useApp } from '../context/AppContext';
import { DetailLevel } from '../types';
import { colors } from '../theme';

const LEVELS: DetailLevel[] = ['brief', 'standard', 'detailed'];

export default function DetailSegmented() {
  const { theme, detail, setDetail } = useApp();
  const c = colors[theme];

  return (
    <View style={[styles.seg, { backgroundColor: c.surface2 }]} accessibilityRole="tablist">
      {LEVELS.map((l) => {
        const active = l === detail;
        return (
          <TouchableOpacity
            key={l}
            onPress={() => setDetail(l)}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            style={[styles.item, active && { backgroundColor: c.bg }]}
          >
            <Text style={[styles.label, { color: active ? c.ink : c.inkMuted, fontWeight: active ? '700' : '600' }]}>
              {l.charAt(0).toUpperCase() + l.slice(1)}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  seg: { flexDirection: 'row', gap: 6, borderRadius: 12, padding: 6, marginHorizontal: 16, marginTop: 12 },
  item: { flex: 1, minHeight: 44, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  label: { fontSize: 13 },
});
