// Desconectado del flujo de chat (corrección de alcance 2026-08-24): mostrar
// esto como banner persistente además del ThinkingIndicator generaba dos
// animaciones a la vez en pantalla. La escena temática ahora vive DENTRO de
// ThinkingIndicator (ver ese componente y THEME_SCENE ahí) — un solo
// elemento, visible solo mientras se espera respuesta. Nada importa este
// componente hoy.

import { useEffect, useRef, useState } from "react";

import { prefersReducedMotion } from "@/lib/motion";

import type { TripTheme } from "../tripThemeDetector";
import { AdventureScene, BeachScene, CityScene, FoodScene, LuggageScene, MountainScene } from "./scenes";

interface TripThemeSceneProps {
  theme: TripTheme;
}

const SCENE_BY_THEME: Record<TripTheme, () => React.JSX.Element> = {
  default: LuggageScene,
  beach: BeachScene,
  mountain: MountainScene,
  city: CityScene,
  food: FoodScene,
  adventure: AdventureScene,
};

const CAPTION_BY_THEME: Record<TripTheme, string> = {
  default: "Preparando tu viaje…",
  beach: "Preparando una escapada junto al mar…",
  mountain: "Buscando una aventura entre montañas nevadas…",
  city: "Explorando opciones en la ciudad…",
  food: "Buscando experiencias para disfrutar…",
  adventure: "Buscando tu próxima aventura…",
};

const FADE_MS = 220;

/**
 * Ambientación sutil del viaje detectado: vive fuera de la burbuja de
 * mensajes (no reemplaza a ThinkingIndicator, que es sobre el estado de la
 * IA, no sobre el destino) pero reusa el mismo tamaño/lenguaje visual de
 * Animaciones.html (176×56, un trazo, sin sombras) para no competir con la
 * legibilidad del chat.
 */
export function TripThemeScene({ theme }: TripThemeSceneProps) {
  const [displayedTheme, setDisplayedTheme] = useState(theme);
  const [fading, setFading] = useState(false);
  const fadeTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    if (theme === displayedTheme) return;
    if (prefersReducedMotion()) {
      setDisplayedTheme(theme);
      return;
    }
    setFading(true);
    fadeTimer.current = setTimeout(() => {
      setDisplayedTheme(theme);
      setFading(false);
    }, FADE_MS);
    return () => clearTimeout(fadeTimer.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [theme]);

  const Scene = SCENE_BY_THEME[displayedTheme];

  return (
    <div
      aria-hidden="true"
      className="fv-theme-transition mb-3 flex items-center gap-3 self-start rounded-xl border border-border bg-accent-soft/60 px-3 py-2 opacity-80"
    >
      <div
        className="transition-opacity duration-[220ms] ease-out"
        style={{ opacity: fading ? 0 : 1 }}
      >
        <Scene />
      </div>
      <span className="text-[13px] text-muted-foreground">{CAPTION_BY_THEME[displayedTheme]}</span>
    </div>
  );
}
