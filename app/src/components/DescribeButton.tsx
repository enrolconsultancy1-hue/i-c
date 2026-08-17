import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { colors } from '../theme';

export default function DescribeButton({ onPress }: { onPress?: () => void }) {
  const { theme, describe, describing } = useApp();
  const handler = onPress ?? (() => { void describe(); });
  const c = colors[theme];
  const bg = describing ? c.signal : c.accent;
  const fg = describing ? c.signalInk : c.accentInk;

  return (
    <TouchableOpacity
      onPress={handler}
      disabled={describing}
      accessibilityRole="button"
      accessibilityLabel="Describe my surroundings"
      activeOpacity={0.85}
      style={[styles.btn, { backgroundColor: bg }]}
    >
      {describing ? (
        <ActivityIndicator color={fg} />
      ) : (
        <Ionicons name="camera-outline" size={24} color={fg} />
      )}
      <Text style={[styles.label, { color: fg }]}>
        {describing ? 'Listening\u2026' : 'Describe my surroundings'}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    minHeight: 64,
    borderRadius: 12,
    marginHorizontal: 16,
    marginTop: 12,
  },
  label: { fontSize: 18, fontWeight: '800' },
});
