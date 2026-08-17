import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { DetailLevel, Mode, Screen, Theme } from '../types';
import { describeScene } from '../services/vision';
import { speak } from '../services/speech';
import { RouteOption } from '../services/maps';

interface AppState {
  theme: Theme;
  setTheme: (t: Theme) => void;
  detail: DetailLevel;
  setDetail: (d: DetailLevel) => void;
  offline: boolean;
  setOffline: (v: boolean) => void;
  mode: Mode;
  setMode: (m: Mode) => void;
  screen: Screen;
  setScreen: (s: Screen) => void;
  route: RouteOption | null;
  setRoute: (r: RouteOption | null) => void;
  narration: string;
  describing: boolean;
  describe: (imageBase64?: string) => Promise<void>;
  streaming: boolean;
  toggleStreaming: () => void;
  announce: (text: string) => void;
}

const AppContext = createContext<AppState | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light');
  const [detail, setDetail] = useState<DetailLevel>('detailed');
  const [offline, setOffline] = useState(false);
  const [mode, setMode] = useState<Mode>('outdoor');
  const [screen, setScreen] = useState<Screen>('live');
  const [route, setRoute] = useState<RouteOption | null>(null);
  const [narration, setNarration] = useState("Tap \u201CDescribe\u201D to hear what's around you.");
  const [describing, setDescribing] = useState(false);
  const [streaming, setStreaming] = useState(false);

  const describe = useCallback(
    async (imageBase64?: string) => {
      if (describing) return;
      setDescribing(true);
      const text = await describeScene(detail, offline, mode, imageBase64);
      setNarration(text);
      speak(text, detail);
      setDescribing(false);
    },
    [describing, detail, offline, mode],
  );

  const announce = useCallback(
    (text: string) => {
      setNarration(text);
      speak(text, detail);
    },
    [detail],
  );

  const toggleStreaming = useCallback(() => {
    setStreaming((s) => !s);
  }, []);

  const value = useMemo<AppState>(
    () => ({
      theme,
      setTheme,
      detail,
      setDetail,
      offline,
      setOffline,
      mode,
      setMode,
      screen,
      setScreen,
      route,
      setRoute,
      narration,
      describing,
      describe,
      streaming,
      toggleStreaming,
      announce,
    }),
    [theme, detail, offline, mode, screen, route, narration, describing, describe, streaming, toggleStreaming, announce],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppState {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
