import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator, ScrollView } from 'react-native';
import * as Location from 'expo-location';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { fetchRoutes, RouteOption, decodePolyline, regionFor } from '../services/maps';
import { colors, font } from '../theme';

export default function RoutePreviewScreen() {
  const { theme, setScreen, setRoute } = useApp();
  const c = colors[theme];
  const [destination, setDestination] = useState('');
  const [origin, setOrigin] = useState<string | null>(null);
  const [status, setStatus] = useState('Getting your location…');
  const [routes, setRoutes] = useState<RouteOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState('');

  const selectedRoute = routes.find((x) => x.id === selected);
  const poly = selectedRoute?.polyline ? decodePolyline(selectedRoute.polyline) : [];
  const region = regionFor(poly);

  useEffect(() => {
    (async () => {
      try {
        const perm = await Location.requestForegroundPermissionsAsync();
        if (perm.status !== 'granted') {
          setStatus('Location permission denied — enable it to route from here.');
          return;
        }
        const pos = await Location.getCurrentPositionAsync({});
        setOrigin(`${pos.coords.latitude},${pos.coords.longitude}`);
        setStatus('Current location ready.');
      } catch {
        setStatus('Could not get location. Try again.');
      }
    })();
  }, []);

  const handleGetRoutes = async () => {
    const dest = destination.trim();
    if (!dest || loading) return;
    setLoading(true);
    setRoutes([]);
    try {
      if (!origin) {
        setStatus('Waiting for location…');
        return;
      }
      const list = await fetchRoutes(origin, dest);
      setRoutes(list);
      setSelected(list[0]?.id ?? '');
      setStatus(list.length ? `${list.length} route(s) found` : 'No routes found');
    } catch (e: any) {
      setStatus(e?.message ?? 'Could not fetch routes.');
    } finally {
      setLoading(false);
    }
  };

  const startGuidance = () => {
    if (selectedRoute) {
      setRoute(selectedRoute);
      setScreen('nav');
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: c.bg }]}>
      <View style={[styles.mapBox, { backgroundColor: theme === 'dark' ? '#241F1A' : '#E8E2D8' }]}>
        {poly.length ? (
          <MapView style={StyleSheet.absoluteFill} initialRegion={region ?? undefined}>
            <Polyline coordinates={poly.map((p) => ({ latitude: p.lat, longitude: p.lng }))} strokeColor={c.accent} strokeWidth={6} />
            <Marker coordinate={{ latitude: poly[0].lat, longitude: poly[0].lng }} title="Start" />
            <Marker coordinate={{ latitude: poly[poly.length - 1].lat, longitude: poly[poly.length - 1].lng }} title="Destination" />
          </MapView>
        ) : (
          <View style={styles.mapPlaceholder}>
            <Ionicons name="map-outline" size={26} color={c.inkMuted} />
            <Text style={[styles.mapPhText, { color: c.inkMuted }]}>Route preview appears here</Text>
          </View>
        )}
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.body}>
        <Text style={[styles.title, { color: c.ink }]}>Where to?</Text>

        <View style={[styles.card, { backgroundColor: c.surface, borderColor: c.border }]}>
          <Text style={[styles.src, { color: c.inkMuted, fontFamily: font.mono }]}>DESTINATION</Text>
          <TextInput
            value={destination}
            onChangeText={setDestination}
            placeholder="e.g. Riverside Cafe, Main St"
            placeholderTextColor={c.inkMuted}
            accessibilityLabel="Destination"
            style={[styles.input, { color: c.ink, backgroundColor: c.bg, borderColor: c.border }]}
          />
          <Text style={[styles.status, { color: c.inkMuted }]}>{status}</Text>
        </View>

        <TouchableOpacity
          onPress={handleGetRoutes}
          disabled={loading || !destination.trim()}
          accessibilityRole="button"
          style={[styles.getBtn, { backgroundColor: c.signal, opacity: loading || !destination.trim() ? 0.6 : 1 }]}
        >
          {loading ? <ActivityIndicator color={c.signalInk} /> : <Ionicons name="search-outline" size={20} color={c.signalInk} />}
          <Text style={[styles.getText, { color: c.signalInk }]}>{loading ? 'Finding routes…' : 'Get routes'}</Text>
        </TouchableOpacity>

        {routes.map((r) => {
          const active = r.id === selected;
          return (
            <TouchableOpacity
              key={r.id}
              onPress={() => setSelected(r.id)}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              style={[styles.option, { backgroundColor: c.surface, borderColor: active ? c.signal : c.border, borderWidth: active ? 2 : 1 }]}
            >
              <View style={{ flex: 1 }}>
                <Text style={[styles.optLabel, { color: c.ink }]}>
                  {r.label}
                  {r.note ? <Text style={{ color: c.inkMuted }}> · {r.note}</Text> : null}
                </Text>
              </View>
              <Text style={[styles.optEta, { color: c.ink, fontFamily: font.mono }]}>
                {r.etaMin} min · {r.distanceKm} km
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          onPress={startGuidance}
          disabled={!selectedRoute}
          accessibilityRole="button"
          style={[styles.start, { backgroundColor: c.accent, opacity: selectedRoute ? 1 : 0.5 }]}
        >
          <Ionicons name="navigate-outline" size={20} color={c.accentInk} />
          <Text style={[styles.startText, { color: c.accentInk }]}>Start guidance</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  mapBox: { height: 220, margin: 16, marginBottom: 0, borderRadius: 16, overflow: 'hidden' },
  mapPlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8, padding: 16 },
  mapPhText: { fontSize: 13, textAlign: 'center', lineHeight: 19 },
  body: { padding: 16, paddingBottom: 12 },
  title: { fontSize: 26, fontWeight: '800', marginBottom: 14 },
  card: { borderRadius: 14, borderWidth: 1, padding: 16, marginBottom: 12 },
  src: { fontSize: 10, fontWeight: '700', letterSpacing: 1, marginBottom: 6 },
  input: { borderRadius: 10, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 10, fontSize: 16, fontWeight: '600', marginBottom: 6 },
  status: { fontSize: 12, marginTop: 4 },
  getBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, minHeight: 52, borderRadius: 12, marginBottom: 4 },
  getText: { fontSize: 16, fontWeight: '800' },
  option: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, padding: 14, marginTop: 10 },
  optLabel: { fontSize: 15, fontWeight: '700' },
  optEta: { fontSize: 13, fontWeight: '700' },
  footer: { padding: 16, paddingTop: 8 },
  start: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, minHeight: 56, borderRadius: 12 },
  startText: { fontSize: 16, fontWeight: '800' },
});
