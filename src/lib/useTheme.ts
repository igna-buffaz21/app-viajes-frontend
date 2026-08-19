// src/lib/useTheme.ts
import { useSyncExternalStore } from "react";

import { applyTheme, getStoredTheme, getSystemTheme, persistTheme, resolveInitialTheme, type Theme } from "./theme";

type Listener = () => void;

let currentTheme: Theme = resolveInitialTheme();
const listeners = new Set<Listener>();

function notify(): void {
  listeners.forEach((listener) => listener());
}

function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot(): Theme {
  return currentTheme;
}

function setGlobalTheme(next: Theme): void {
  currentTheme = next;
  applyTheme(next);
  notify();
}

let systemListenerAttached = false;

function ensureSystemListener(): void {
  if (systemListenerAttached || typeof window === "undefined") return;
  systemListenerAttached = true;

  const media = window.matchMedia("(prefers-color-scheme: dark)");
  media.addEventListener("change", () => {
    if (getStoredTheme() !== null) return;
    setGlobalTheme(getSystemTheme());
  });
}

if (typeof window !== "undefined") {
  applyTheme(currentTheme);
  ensureSystemListener();
}

export function useTheme(): { theme: Theme; setTheme: (next: Theme) => void } {
  const theme = useSyncExternalStore(subscribe, getSnapshot);

  function setTheme(next: Theme): void {
    setGlobalTheme(next);
    persistTheme(next);
  }

  return { theme, setTheme };
}
