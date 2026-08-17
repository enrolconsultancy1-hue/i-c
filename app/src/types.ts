export type DetailLevel = 'brief' | 'standard' | 'detailed';
export type Theme = 'light' | 'dark';
export type Mode = 'indoor' | 'outdoor';
export type Screen = 'live' | 'radar' | 'reader' | 'route' | 'nav';
export type Direction = 'left' | 'right' | 'ahead' | 'behind';

export interface DetectedObject {
  id: string;
  name: string;
  direction: Direction;
  distanceM: number;
  note?: string;
}
