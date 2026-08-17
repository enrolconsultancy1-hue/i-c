import * as Speech from 'expo-speech';
import { DetailLevel } from '../types';

const RATE: Record<DetailLevel, number> = { brief: 1.0, standard: 0.95, detailed: 0.9 };

/**
 * Text-to-speech wrapper. Speech rate adapts to the narration detail level.
 * Voice selection (per user language) can be added via Speech.getAvailableVoicesAsync().
 */
export function speak(text: string, detail: DetailLevel) {
  Speech.stop();
  Speech.speak(text, { rate: RATE[detail], language: 'en-US' });
}

export function stopSpeaking() {
  Speech.stop();
}
