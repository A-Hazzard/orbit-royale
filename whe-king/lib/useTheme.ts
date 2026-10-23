"use client";
import { useCallback, useEffect, useSyncExternalStore } from "react";

export const THEMES = [
  { id: "gold", name: "Midnight Gold", swatch: "linear-gradient(135deg,#ffd54a,#7c4dff)" },
  { id: "felt", name: "Green Felt", swatch: "linear-gradient(135deg,#17653f,#b8202a)" },
  { id: "deco", name: "Noir Deco", swatch: "linear-gradient(135deg,#0a0a0c,#d9b874)" },
  { id: "velvet", name: "Red Velvet", swatch: "linear-gradient(135deg,#7d101f,#000)" },
  { id: "booth", name: "Heritage Booth", swatch: "linear-gradient(135deg,#f0e5c8,#c8281e)" },
] as const;
export type ThemeId = (typeof THEMES)[number]["id"];

const KEY = "whe-theme";
const EVT = "whe-theme-change";
const valid = (v: string | null): v is ThemeId => THEMES.some((t) => t.id === v);

function read(): ThemeId {
  try {
    const q = new URLSearchParams(location.search).get("theme");
    if (valid(q)) return q;
    const s = localStorage.getItem(KEY);
    if (valid(s)) return s;
  } catch {}
  return "gold";
}

const subscribe = (cb: () => void) => {
  window.addEventListener(EVT, cb);
  return () => window.removeEventListener(EVT, cb);
};

export function useTheme(): [ThemeId, (t: ThemeId) => void] {
  const theme = useSyncExternalStore(subscribe, read, () => "gold" as ThemeId);
  useEffect(() => { document.documentElement.dataset.theme = theme; }, [theme]);
  const set = useCallback((t: ThemeId) => {
    try { localStorage.setItem(KEY, t); } catch {}
    window.dispatchEvent(new Event(EVT));
  }, []);
  return [theme, set];
}
