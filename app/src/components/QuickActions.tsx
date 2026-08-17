import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { Screen } from '../types';
import { colors } from '../theme';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

const ITEMS: { key: Screen; label: string; icon: IconName }[] = [
  { key: 'reader', label: 'Read text', icon: 'book-outline' },
  { key: 'radar', label: 'Radar', icon: 'radio-outline' },
  { key: 'route', label: 'Navigate', icon: 'map-outline' },
];

export default function QuickActions() {
  const { theme, setScreen, mode } = useApp();
  const c = colors[theme];
  const outdoor = mode === 'outdoor';

  return (
    <View style={styles.row}>
      {ITEMS.map((it) => {
        const isNav = it.key === 'route';
        const disabled = isNav && !outdoor;
        return (
          <TouchableOpacity
            key={it.key}
            onPress={() => setScreen(it.key)}
            disabled={disabled}
            accessibilityRole="button"
            accessibilityState={{ disabled }}
            style={[styles.qa, { backgroundColor: c.surface, borderColor: c.borderStrong }, disabled && { opacity: 0.42 }]}
          >
            <Ionicons name={it.icon} size={22} color={c.ink} />
            <Text style={[styles.label, { color: c.ink }]}>
              {isNav && !outdoor ? 'Outdoor only' : it.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 10, padding: 14, paddingBottom: 18 },
  qa: {
    flex: 1,
    minHeight: 66,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  label: { fontSize: 12, fontWeight: '600' },
});
