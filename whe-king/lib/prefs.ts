"use client";
import { useCallback, useEffect, useSyncExternalStore } from "react";

export const THEMES = [
  { id: "gold", name: "Midnight Gold", swatch: "linear-gradient(135deg,#ffd54a,#7c4dff)" },
  { id: "felt", name: "Green Felt", swatch: "linear-gradient(135deg,#17653f,#b8202a)" },
  { id: "deco", name: "Noir Deco", swatch: "linear-gradient(135deg,#0a0a0c,#d9b874)" },
  { id: "velvet", name: "Red Velvet", swatch: "linear-gradient(135deg,#7d101f,#000)" },
  { id: "booth", name: "Heritage Booth", swatch: "linear-gradient(135deg,#f0e5c8,#c8281e)" },
] as const;

export const LAYOUTS = [
  { id: "grid", name: "Grid", glyph: "▦" },
  { id: "chart", name: "Mark Chart", glyph: "▤" },
  { id: "wheel", name: "Wheel", glyph: "◎" },
  { id: "steps", name: "Steps", glyph: "①" },
] as const;

export type ThemeId = (typeof THEMES)[number]["id"];
export type LayoutId = (typeof LAYOUTS)[number]["id"];

const EVT = "whe-pref-change";
const subscribe = (cb: () => void) => {
  window.addEventListener(EVT, cb);
  return () => window.removeEventListener(EVT, cb);
};

// A preference lives in the URL (?theme= / ?layout=) first, then localStorage.
function usePref<T extends string>(key: string, ids: readonly T[], fallback: T): [T, (v: T) => void] {
  const read = useCallback((): T => {
    try {
      const q = new URLSearchParams(location.search).get(key);
      if (ids.includes(q as T)) return q as T;
      const s = localStorage.getItem("whe-" + key);
      if (ids.includes(s as T)) return s as T;
    } catch {}
    return fallback;
  }, [key, ids, fallback]);
  const value = useSyncExternalStore(subscribe, read, () => fallback);
  const set = useCallback((v: T) => {
    try { localStorage.setItem("whe-" + key, v); } catch {}
    window.dispatchEvent(new Event(EVT));
  }, [key]);
  return [value, set];
}

const THEME_IDS = THEMES.map((t) => t.id);
const LAYOUT_IDS = LAYOUTS.map((l) => l.id);

export function useTheme() {
  const r = usePref<ThemeId>("theme", THEME_IDS, "gold");
  useEffect(() => { document.documentElement.dataset.theme = r[0]; }, [r]);
  return r;
}
export const useLayout = () => usePref<LayoutId>("layout", LAYOUT_IDS, "grid");
