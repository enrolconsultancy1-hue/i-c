import React, { useEffect } from 'react';
import { BackHandler, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { AppProvider, useApp } from './src/context/AppContext';
import { colors } from './src/theme';
import StatusStrip from './src/components/StatusStrip';
import OfflineBanner from './src/components/OfflineBanner';
import LiveViewScreen from './src/screens/LiveViewScreen';
import RadarScreen from './src/screens/RadarScreen';
import TextReaderScreen from './src/screens/TextReaderScreen';
import RoutePreviewScreen from './src/screens/RoutePreviewScreen';
import NavigationScreen from './src/screens/NavigationScreen';

function Router() {
  const { screen } = useApp();
  switch (screen) {
    case 'radar':
      return <RadarScreen />;
    case 'reader':
      return <TextReaderScreen />;
    case 'route':
      return <RoutePreviewScreen />;
    case 'nav':
      return <NavigationScreen />;
    default:
      return <LiveViewScreen />;
  }
}

function Shell() {
  const { theme, screen, setScreen } = useApp();
  const c = colors[theme];

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (screen !== 'live') {
        setScreen('live');
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, [screen, setScreen]);

  return (
    <SafeAreaView style={[styles.shell, { backgroundColor: c.bg }]} edges={['top', 'bottom']}>
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
      <StatusStrip />
      <OfflineBanner />
      <Router />
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AppProvider>
        <Shell />
      </AppProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  shell: { flex: 1 },
});
