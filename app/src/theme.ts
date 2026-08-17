import { Platform } from 'react-native';

/**
 * Design tokens from the eye see design system (Accessible & Bold).
 * Signage-grade high contrast: safety orange fills with black text,
 * high-vis yellow for live status.
 */
export const colors = {
  light: {
    bg: '#FFFFFF',
    surface: '#F4F1EB',
    surface2: '#ECE7DD',
    ink: '#111111',
    inkSoft: '#3F3D39',
    inkMuted: '#5E5B54',
    border: '#D9D2C5',
    borderStrong: '#B9B0A0',
    accent: '#FF4D00',
    accentInk: '#111111',
    accentDeep: '#C23A00',
    signal: '#FFC400',
    signalInk: '#111111',
    success: '#16A34A',
    danger: '#DC2626',
  },
  dark: {
    bg: '#0F0F0F',
    surface: '#1A1917',
    surface2: '#24221E',
    ink: '#FFFFFF',
    inkSoft: '#CFCDC7',
    inkMuted: '#A19E96',
    border: '#2E2C27',
    borderStrong: '#4A463E',
    accent: '#FF5A1A',
    accentInk: '#0F0F0F',
    accentDeep: '#FF7A45',
    signal: '#FFC400',
    signalInk: '#0F0F0F',
    success: '#16A34A',
    danger: '#DC2626',
  },
};

export type ThemeColors = typeof colors.light;

/**
 * Monospace for labels, distances, and numerals (tabular numbers).
 * To match the design exactly, add Archivo via expo-font / @expo-google-fonts.
 */
export const font = {
  mono: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }) as string,
};
