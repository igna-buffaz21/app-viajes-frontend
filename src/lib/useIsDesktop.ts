// src/lib/useIsDesktop.ts
//
// Breakpoint para el historial del chat (ver ChatPage): abajo de esto es
// overlay/drawer (Sheet), arriba pasa a ser un panel fijo que empuja el
// contenido. 768px = el `md:` de Tailwind — no había un breakpoint ya
// establecido en el resto de la app para "desktop" (el resto del código
// solo usa sm:/lg: puntuales, ninguno como corte mobile/desktop general),
// así que se eligió `md` por ser la convención más común para este tipo de
// layout de dos paneles.
import { useSyncExternalStore } from "react";

const QUERY = "(min-width: 768px)";

function subscribe(listener: () => void): () => void {
  const mql = window.matchMedia(QUERY);
  mql.addEventListener("change", listener);
  return () => mql.removeEventListener("change", listener);
}

function getSnapshot(): boolean {
  return window.matchMedia(QUERY).matches;
}

export function useIsDesktop(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot);
}
