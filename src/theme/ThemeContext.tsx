import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import type { ThemeMode } from './tokens';

interface ThemeCtx {
  mode: ThemeMode;
  toggle: () => void;
  setMode: (m: ThemeMode) => void;
}

const Ctx = createContext<ThemeCtx>({ mode: 'light', toggle: () => {}, setMode: () => {} });

const KEY = 'wormear-theme';

function systemPrefersDark(): boolean {
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
}

function storedChoice(): ThemeMode | null {
  try {
    const saved = localStorage.getItem(KEY);
    if (saved === 'light' || saved === 'dark') return saved;
  } catch {
    /* storage unavailable — fall through to system preference */
  }
  return null;
}

/** Lazy initializer: correct theme on the very first render, no light-flash. */
function initial(): ThemeMode {
  return storedChoice() ?? (systemPrefersDark() ? 'dark' : 'light');
}

const THEME_COLORS: Record<ThemeMode, string> = { light: '#FBF3D3', dark: '#201A40' };

function applyTheme(mode: ThemeMode) {
  document.documentElement.dataset.theme = mode;
  document.documentElement.style.colorScheme = mode;
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', THEME_COLORS[mode]);
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  // Lazy init so the first paint already matches system/manual preference.
  const [mode, setModeState] = useState<ThemeMode>(initial);
  // Whether the user has explicitly chosen (vs. following the OS).
  const [explicit, setExplicit] = useState<boolean>(() => storedChoice() !== null);
  const explicitRef = useRef(explicit);
  explicitRef.current = explicit;

  // Apply theme to <html>. Persist only explicit user choices, so an
  // OS-driven switch never gets mistaken for a manual preference.
  useEffect(() => {
    applyTheme(mode);
    if (!explicitRef.current) return;
    try {
      localStorage.setItem(KEY, mode);
    } catch {
      /* storage unavailable — theme still applies for this session */
    }
  }, [mode]);

  // Follow OS changes only until the user picks explicitly.
  useEffect(() => {
    const mq = window.matchMedia?.('(prefers-color-scheme: dark)');
    if (!mq) return;
    const onChange = (e: MediaQueryListEvent) => {
      if (explicitRef.current) return;
      setModeState(e.matches ? 'dark' : 'light');
    };
    mq.addEventListener?.('change', onChange);
    return () => mq.removeEventListener?.('change', onChange);
  }, []);

  const setMode = useCallback((m: ThemeMode) => {
    setExplicit(true);
    setModeState(m);
  }, []);
  const toggle = useCallback(() => {
    setExplicit(true);
    setModeState((m) => (m === 'light' ? 'dark' : 'light'));
  }, []);

  return <Ctx.Provider value={{ mode, toggle, setMode }}>{children}</Ctx.Provider>;
}

export function useTheme() {
  return useContext(Ctx);
}
