import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useApp } from '../context/AppContext';
import { colors } from '../theme';

export default function OfflineBanner() {
  const { theme, offline } = useApp();
  if (!offline) return null;
  const c = colors[theme];
  return (
    <View style={[styles.banner, { backgroundColor: c.signal }]} accessibilityRole="alert">
      <Text style={[styles.msg, { color: c.signalInk }]}>
        Offline — using on-device model, descriptions continue.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: { marginHorizontal: 16, marginBottom: 8, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10 },
  msg: { fontSize: 13, fontWeight: '600', lineHeight: 18 },
});
