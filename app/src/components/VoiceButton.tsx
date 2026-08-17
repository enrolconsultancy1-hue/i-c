import React, { useState } from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAudioRecorder, RecordingPresets, requestRecordingPermissionsAsync } from 'expo-audio';
import { useApp } from '../context/AppContext';
import { colors } from '../theme';
import { hasApi } from '../services/api';
import { stopSpeaking } from '../services/speech';
import { fileToBase64, mimeForUri, transcribe, parseCommand, VoiceCommand } from '../services/voice';

type Phase = 'idle' | 'listening' | 'processing';

export default function VoiceButton({ onDescribe }: { onDescribe: () => void }) {
  const { theme, setScreen, announce, mode } = useApp();
  const c = colors[theme];
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const [phase, setPhase] = useState<Phase>('idle');

  const dispatch = async (cmd: VoiceCommand) => {
    switch (cmd.action) {
      case 'describe':
        onDescribe();
        break;
      case 'read':
        setScreen('reader');
        break;
      case 'radar':
        setScreen('radar');
        break;
      case 'navigate':
        if (mode === 'outdoor') setScreen('route');
        else announce('Navigation is outdoor only.');
        break;
      case 'stop':
        stopSpeaking();
        break;
      case 'home':
        setScreen('live');
        break;
      default:
        announce(`I heard: "${cmd.raw}"`);
    }
  };

  const toggle = async () => {
    if (phase === 'processing') return;

    if (phase === 'idle') {
      if (!hasApi()) {
        announce('Run the backend and set API.baseUrl to use voice commands.');
        return;
      }
      const perm = await requestRecordingPermissionsAsync();
      if (!perm.granted) {
        announce('Microphone permission is needed for voice commands.');
        return;
      }
      try {
        await recorder.prepareToRecordAsync();
        recorder.record();
        setPhase('listening');
      } catch {
        announce('Could not start recording.');
      }
      return;
    }

    // phase === 'listening' → stop and transcribe
    try {
      await recorder.stop();
      setPhase('processing');
      const uri = recorder.uri;
      if (!uri) {
        announce('No audio captured.');
        return;
      }
      const b64 = await fileToBase64(uri);
      const text = await transcribe(b64, mimeForUri(uri));
      await dispatch(parseCommand(text));
    } catch {
      announce('Voice command failed — check the backend.');
    } finally {
      setPhase('idle');
    }
  };

  const listening = phase === 'listening';
  const processing = phase === 'processing';

  return (
    <TouchableOpacity
      onPress={toggle}
      disabled={processing}
      accessibilityRole="button"
      accessibilityLabel={listening ? 'Stop voice command' : 'Voice command'}
      activeOpacity={0.85}
      style={[
        styles.btn,
        { backgroundColor: listening ? c.accent : c.surface, borderColor: listening ? c.accent : c.borderStrong },
      ]}
    >
      {processing ? (
        <ActivityIndicator color={c.ink} />
      ) : (
        <Ionicons name={listening ? 'stop' : 'mic-outline'} size={20} color={listening ? c.accentInk : c.ink} />
      )}
      <Text style={[styles.label, { color: listening ? c.accentInk : c.ink }]}>
        {processing ? 'Understanding…' : listening ? 'Listening — tap to send' : 'Voice command'}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 44,
    borderRadius: 12,
    borderWidth: 1.5,
    marginHorizontal: 16,
    marginTop: 8,
  },
  label: { fontSize: 14, fontWeight: '700' },
});
