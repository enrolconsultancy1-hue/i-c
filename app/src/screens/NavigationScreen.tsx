import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import * as Location from 'expo-location';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { fetchRoutes, decodePolyline, distanceM, regionFor } from '../services/maps';
import { speak, stopSpeaking } from '../services/speech';
import { colors, font } from '../theme';

export default function NavigationScreen() {
  const { theme, setScreen, route, setRoute, detail } = useApp();
  const c = colors[theme];

  const [step, setStep] = useState(0);
  const [pos, setPos] = useState<{ lat: number; lng: number } | null>(null);
  const [nextTurnM, setNextTurnM] = useState<number | null>(null);
  const [live, setLive] = useState(false);

  const stepRef = useRef(0);
  const posRef = useRef<{ lat: number; lng: number } | null>(null);
  const offCount = useRef(0);
  const arrivedRef = useRef(false);
  const reroutingRef = useRef(false);

  const steps = route?.steps ?? [];
  const current = steps[step];
  const poly = route?.polyline ? decodePolyline(route.polyline) : [];
  const hasGeo = poly.length > 0 && steps.some((s) => s.endLat || s.endLng);
  const region = regionFor(poly.length ? poly : pos ? [pos] : []);

  const sayStep = useCallback(
    (i: number) => {
      const s = route?.steps[i];
      if (s) speak(s.distanceM ? `${s.instruction} in ${s.distanceM} meters.` : s.instruction, detail);
    },
    [route, detail],
  );

  const goTo = useCallback(
    (n: number) => {
      const s = route?.steps[n];
      if (!s) {
        if ((route?.steps.length ?? 0) > 0 && !arrivedRef.current) {
          arrivedRef.current = true;
          speak('You have arrived at your destination.', detail);
        }
        return;
      }
      arrivedRef.current = false;
      stepRef.current = n;
      setStep(n);
      sayStep(n);
    },
    [route, sayStep, detail],
  );

  const reroute = useCallback(async () => {
    const p = posRef.current;
    if (!route || !p || reroutingRef.current) return;
    reroutingRef.current = true;
    stopSpeaking();
    speak('Recalculating route.', detail);
    try {
      const list = await fetchRoutes(`${p.lat},${p.lng}`, route.destination);
      if (list[0]) setRoute(list[0]);
    } catch {
      speak('Could not recalculate. Continuing on route.', detail);
    } finally {
      reroutingRef.current = false;
    }
  }, [route, detail, setRoute]);

  // Reset + announce the first turn whenever the route changes.
  useEffect(() => {
    stepRef.current = 0;
    arrivedRef.current = false;
    offCount.current = 0;
    setStep(0);
    setNextTurnM(null);
    setPos(null);
    posRef.current = null;
    if (route?.steps.length) sayStep(0);
    return () => stopSpeaking();
  }, [route?.id]);

  // Live GPS tracking: auto-advance on approach, reroute when off-route.
  useEffect(() => {
    if (!hasGeo || !route) return;
    let sub: { remove: () => void } | undefined;
    let mounted = true;
    (async () => {
      const perm = await Location.requestForegroundPermissionsAsync();
      if (perm.status !== 'granted' || !mounted) return;
      setLive(true);
      sub = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.Balanced, timeInterval: 2500, distanceInterval: 3 },
        (loc) => {
          if (!mounted) return;
          const p = { lat: loc.coords.latitude, lng: loc.coords.longitude };
          posRef.current = p;
          setPos(p);

          const st = route.steps[stepRef.current];
          if (st && (st.endLat || st.endLng)) {
            const dEnd = distanceM(p.lat, p.lng, st.endLat, st.endLng);
            setNextTurnM(Math.round(dEnd));
            if (dEnd < 12) goTo(stepRef.current + 1);
          }

          const pts = route.polyline ? decodePolyline(route.polyline) : [];
          if (pts.length) {
            let min = Infinity;
            for (const q of pts) {
              const d = distanceM(p.lat, p.lng, q.lat, q.lng);
              if (d < min) min = d;
            }
            if (min > 25) {
              offCount.current += 1;
              if (offCount.current >= 3) {
                offCount.current = 0;
                reroute();
              }
            } else {
              offCount.current = 0;
            }
          }
        },
      );
    })();
    return () => {
      mounted = false;
      sub?.remove();
    };
  }, [route?.id, hasGeo, goTo, reroute]);

  return (
    <View style={[styles.root, { backgroundColor: c.bg }]}>
      <View style={[styles.mapBox, { backgroundColor: theme === 'dark' ? '#241F1A' : '#E8E2D8' }]}>
        {poly.length ? (
          <MapView style={StyleSheet.absoluteFill} initialRegion={region ?? undefined}>
            <Polyline coordinates={poly.map((p) => ({ latitude: p.lat, longitude: p.lng }))} strokeColor={c.accent} strokeWidth={6} />
            <Marker coordinate={{ latitude: poly[0].lat, longitude: poly[0].lng }} title="Start" />
            <Marker coordinate={{ latitude: poly[poly.length - 1].lat, longitude: poly[poly.length - 1].lng }} title="Destination" />
            {pos ? <Marker coordinate={{ latitude: pos.lat, longitude: pos.lng }} pinColor={c.signal} /> : null}
          </MapView>
        ) : (
          <View style={styles.mapPlaceholder}>
            <Ionicons name="map-outline" size={26} color={c.inkMuted} />
            <Text style={[styles.mapPhText, { color: c.inkMuted }]}>Route map — add a Maps API key to see it live</Text>
          </View>
        )}
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.body}>
        <View style={styles.titleRow}>
          <Text style={[styles.title, { color: c.ink }]}>Guidance</Text>
          <View style={[styles.badge, { backgroundColor: live ? c.success : c.surface, borderColor: live ? c.success : c.borderStrong }]}>
            <Text style={[styles.badgeText, { color: live ? '#FFFFFF' : c.inkMuted, fontFamily: font.mono }]}>{live ? 'LIVE' : 'MANUAL'}</Text>
          </View>
        </View>

        {route ? (
          <>
            <View style={[styles.turn, { backgroundColor: c.accent }]}>
              <Text style={[styles.turnLbl, { color: c.accentInk, fontFamily: font.mono }]}>
                STEP {step + 1} OF {steps.length}
                {nextTurnM != null ? ` · TURN IN ${nextTurnM} m` : current?.distanceM ? ` · ${current.distanceM} m` : ''}
              </Text>
              <Text style={[styles.turnMain, { color: c.accentInk }]}>{current?.instruction ?? 'Arrived'}</Text>
            </View>

            <View style={styles.etaRow}>
              {[
                { l: 'DESTINATION', v: 'On route' },
                { l: 'TIME', v: `${route.etaMin} min` },
                { l: 'DISTANCE', v: `${route.distanceKm} km` },
              ].map((e) => (
                <View key={e.l} style={[styles.eta, { backgroundColor: c.surface, borderColor: c.border }]}>
                  <Text style={[styles.etaLbl, { color: c.inkMuted, fontFamily: font.mono }]}>{e.l}</Text>
                  <Text style={[styles.etaVal, { color: c.ink, fontFamily: font.mono }]}>{e.v}</Text>
                </View>
              ))}
            </View>

            <View style={styles.controls}>
              <TouchableOpacity onPress={() => goTo(stepRef.current - 1)} disabled={step === 0} accessibilityRole="button" style={[styles.ctrl, { backgroundColor: c.surface, borderColor: c.borderStrong, opacity: step === 0 ? 0.4 : 1 }]}>
                <Ionicons name="arrow-back" size={20} color={c.ink} />
                <Text style={[styles.ctrlText, { color: c.ink }]}>Prev</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => sayStep(step)} accessibilityRole="button" style={[styles.ctrl, { backgroundColor: c.signal }]}>
                <Ionicons name="volume-high-outline" size={20} color={c.signalInk} />
                <Text style={[styles.ctrlText, { color: c.signalInk }]}>Repeat</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => goTo(stepRef.current + 1)} disabled={step >= steps.length - 1} accessibilityRole="button" style={[styles.ctrl, { backgroundColor: c.surface, borderColor: c.borderStrong, opacity: step >= steps.length - 1 ? 0.4 : 1 }]}>
                <Ionicons name="arrow-forward" size={20} color={c.ink} />
                <Text style={[styles.ctrlText, { color: c.ink }]}>Next</Text>
              </TouchableOpacity>
            </View>

            <Text style={[styles.note, { color: c.inkMuted }]}>
              {hasGeo
                ? 'Live guidance: turns announce automatically and advance as you reach each one. Walk off-route and it recalculates.'
                : 'Demo route — add a Google Maps API key in src/config.ts (MAPS.apiKey) to enable live guidance.'}
            </Text>
          </>
        ) : (
          <Text style={[styles.note, { color: c.inkMuted }]}>No route loaded. Go back and get a route first.</Text>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity onPress={() => setScreen('live')} accessibilityRole="button" style={[styles.end, { backgroundColor: c.surface, borderColor: c.borderStrong }]}>
          <Ionicons name="close-circle-outline" size={20} color={c.ink} />
          <Text style={[styles.endText, { color: c.ink }]}>End guidance</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  mapBox: { height: 200, margin: 16, marginBottom: 0, borderRadius: 16, overflow: 'hidden' },
  mapPlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8, padding: 16 },
  mapPhText: { fontSize: 13, textAlign: 'center', lineHeight: 19 },
  body: { padding: 16, paddingBottom: 12 },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  title: { fontSize: 26, fontWeight: '800' },
  badge: { borderRadius: 8, borderWidth: 1.5, paddingHorizontal: 10, paddingVertical: 5 },
  badgeText: { fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  turn: { borderRadius: 14, padding: 16 },
  turnLbl: { fontSize: 10, fontWeight: '700', letterSpacing: 1, opacity: 0.7, marginBottom: 6 },
  turnMain: { fontSize: 22, fontWeight: '800', lineHeight: 28 },
  etaRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
  eta: { flex: 1, borderRadius: 12, borderWidth: 1, padding: 12 },
  etaLbl: { fontSize: 9, fontWeight: '700', letterSpacing: 1, marginBottom: 4 },
  etaVal: { fontSize: 16, fontWeight: '700' },
  controls: { flexDirection: 'row', gap: 8, marginTop: 14 },
  ctrl: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, minHeight: 52, borderRadius: 12, borderWidth: 1.5 },
  ctrlText: { fontSize: 14, fontWeight: '700' },
  note: { fontSize: 12, lineHeight: 19, marginTop: 14 },
  footer: { padding: 16, paddingTop: 8 },
  end: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, minHeight: 56, borderRadius: 12, borderWidth: 1.5 },
  endText: { fontSize: 16, fontWeight: '700' },
});
