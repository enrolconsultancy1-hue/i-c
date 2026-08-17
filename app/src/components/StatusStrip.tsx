import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { colors, font } from '../theme';

export default function StatusStrip() {
  const { theme, setTheme, offline, setOffline, detail, mode, screen, setScreen } = useApp();
  const c = colors[theme];
  const back = screen !== 'live';
  const modeLabel =
    screen === 'nav' ? 'LIVE · GOOGLE MAPS' : `${mode.toUpperCase()} · ${detail.toUpperCase()}`;

  return (
    <View style={[styles.bar, { backgroundColor: c.bg, borderBottomColor: c.border }]}>
      {back ? (
        <TouchableOpacity
          onPress={() => setScreen('live')}
          accessibilityRole="button"
          accessibilityLabel="Back to live view"
          style={styles.back}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="chevron-back" size={22} color={c.ink} />
          <Text style={[styles.backLabel, { color: c.ink }]}>Back</Text>
        </TouchableOpacity>
      ) : (
        <Text style={[styles.time, { color: c.ink, fontFamily: font.mono }]}>9:41</Text>
      )}

      <Text style={[styles.mode, { color: c.inkMuted, fontFamily: font.mono }]}>{modeLabel}</Text>

      <View style={styles.right}>
        <TouchableOpacity
          onPress={() => setOffline(!offline)}
          accessibilityRole="button"
          accessibilityLabel="Toggle offline mode"
          style={styles.stat}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <View style={[styles.dot, { backgroundColor: offline ? c.accent : c.success }]} />
          <Text style={[styles.statText, { color: offline ? c.accentDeep : c.inkMuted, fontFamily: font.mono }]}>
            {offline ? 'OFF' : 'ON'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          accessibilityRole="button"
          accessibilityLabel="Toggle theme"
          style={styles.theme}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name={theme === 'dark' ? 'sunny-outline' : 'moon-outline'} size={20} color={c.ink} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  back: { flexDirection: 'row', alignItems: 'center', gap: 4, width: 84, justifyContent: 'flex-start' },
  backLabel: { fontSize: 14, fontWeight: '700' },
  time: { fontSize: 14, fontWeight: '700', width: 84 },
  mode: { flex: 1, textAlign: 'center', fontSize: 11, fontWeight: '700', letterSpacing: 1 },
  right: { flexDirection: 'row', alignItems: 'center', gap: 10, width: 84, justifyContent: 'flex-end' },
  stat: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  dot: { width: 7, height: 7, borderRadius: 4 },
  statText: { fontSize: 11, fontWeight: '700' },
  theme: { width: 34, alignItems: 'center' },
});
