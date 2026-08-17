import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { colors } from '../theme';
import { hasApi } from '../services/api';

export default function StreamToggle() {
  const { theme, streaming, toggleStreaming } = useApp();
  const c = colors[theme];
  const ready = hasApi();

  return (
    <TouchableOpacity
      onPress={toggleStreaming}
      accessibilityRole="switch"
      accessibilityState={{ checked: streaming }}
      accessibilityLabel={streaming ? 'Stop live narration' : 'Start live narration'}
      activeOpacity={0.85}
      style={[
        styles.btn,
        {
          backgroundColor: streaming ? c.signal : c.surface,
          borderColor: streaming ? c.signal : c.borderStrong,
        },
      ]}
    >
      <View style={[styles.dot, { backgroundColor: streaming ? c.signalInk : ready ? c.success : c.borderStrong }]} />
      <Text style={[styles.label, { color: streaming ? c.signalInk : c.ink }]}>
        {streaming ? 'Live narration — tap to stop' : ready ? 'Continuous narration' : 'Continuous narration — needs backend'}
      </Text>
      <Ionicons name={streaming ? 'pause' : 'radio-outline'} size={18} color={streaming ? c.signalInk : c.inkMuted} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 44,
    borderRadius: 12,
    borderWidth: 1.5,
    paddingHorizontal: 14,
    marginHorizontal: 16,
    marginTop: 8,
  },
  dot: { width: 8, height: 8, borderRadius: 4 },
  label: { flex: 1, fontSize: 14, fontWeight: '700' },
});
