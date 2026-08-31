import { useEffect, useRef, useState, type ComponentType } from "react";

import { AdventureScene, BeachScene, CityScene, FoodScene, MountainScene, PlaneScene } from "./scenes";
import { useThinkingSlide } from "../thinkingMessages";
import type { TripTheme } from "../tripThemeDetector";

interface ThinkingIndicatorProps {
  active: boolean;
  /** Tema de viaje ya detectado en la conversación (ver tripThemeDetector.ts). "default" = sin tema todavía. */
  theme?: TripTheme;
}

/**
 * Escena "tema" del ciclo cuando ya hay uno detectado — alterna con
 * PlaneScene (ver useThinkingSlide en thinkingMessages.ts). "default" no
 * tiene entrada acá a propósito: en ese caso el ciclo es siempre PlaneScene.
 */
const THEME_SCENE: Partial<Record<TripTheme, ComponentType<{ className?: string }>>> = {
  beach: BeachScene,
  mountain: MountainScene,
  city: CityScene,
  food: FoodScene,
  adventure: AdventureScene,
};

const EXIT_MS = 200;

export function ThinkingIndicator({ active, theme = "default" }: ThinkingIndicatorProps) {
  const [mounted, setMounted] = useState(active);
  const [leaving, setLeaving] = useState(false);
  const exitTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const isShowing = mounted && !leaving;
  const slide = useThinkingSlide(isShowing, theme);

  useEffect(() => {
    if (active) {
      clearTimeout(exitTimer.current);
      setLeaving(false);
      setMounted(true);
      return;
    }
    if (!mounted) return;
    setLeaving(true);
    exitTimer.current = setTimeout(() => setMounted(false), EXIT_MS);
    return () => clearTimeout(exitTimer.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  if (!mounted) return null;

  const ThemeSceneComponent = theme !== "default" ? THEME_SCENE[theme] : undefined;
  const mostrarTema = slide.scene === "theme" && Boolean(ThemeSceneComponent);
  const SceneComponent = mostrarTema ? ThemeSceneComponent! : PlaneScene;

  return (
    <div
      role="status"
      aria-live="polite"
      className={`flex min-h-[46px] items-center pl-0.5 ${leaving ? "fv-indicator-out" : "fv-indicator-in"}`}
    >
      {/*
        Escena y texto se renderizan directo desde `slide` (useThinkingSlide),
        sin ningún estado intermedio propio acá — a diferencia de la versión
        anterior, que tenía una capa de crossfade de texto separada (220ms de
        delay) mientras la escena cambiaba instantáneo, y terminaban
        desincronizadas (confirmado en pruebas: la escena ya mostraba el
        avión mientras el texto todavía mostraba el mensaje del tema
        anterior). Con un solo `key` sobre TODO el grupo (escena+texto),
        cualquier cambio de `slide` — sea de escena, de texto, o ambos —
        dispara un único remount + fade-in (.fv-scene-swap, index.css) para
        el conjunto entero: nunca pueden quedar desincronizados porque son
        el mismo nodo del DOM.
      */}
      <div key={`${slide.scene}-${slide.text}`} className="fv-scene-swap flex items-center gap-[11px]">
        <SceneComponent className="h-[42px] w-auto" />
        <span className="min-h-[20px] text-[13.5px] text-muted-foreground">{slide.text}</span>
      </div>
    </div>
  );
}
