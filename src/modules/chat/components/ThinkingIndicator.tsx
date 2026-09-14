import { useEffect, useRef, useState, type ComponentType } from "react";

import { AdventureScene, BeachScene, CityScene, FoodScene, MountainScene, PlaneScene } from "./scenes";
import { useThinkingSlide } from "../thinkingMessages";
import type { TripTheme } from "../tripThemeDetector";

interface ThinkingIndicatorProps {
  active: boolean;
  /** Tema de viaje ya detectado en la conversación (ver tripThemeDetector.ts). "default" = sin tema todavía. */
  theme?: TripTheme;
  /** false = solo la escena animada, sin el mensaje rotativo — para loaders genéricos de página completa (ver FullPageLoader.tsx) donde no hay ningún "pensando..." real que mostrar. */
  mostrarTexto?: boolean;
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

export function ThinkingIndicator({ active, theme = "default", mostrarTexto = true }: ThinkingIndicatorProps) {
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
        sin ningún estado intermedio propio acá — así nunca pueden quedar
        desincronizados, ambos salen del mismo objeto en el mismo render.
        Por eso el `key` de abajo NO incluye `slide.text` (a diferencia de
        una versión anterior que sí lo hacía): las escenas (PlaneScene,
        BeachScene, etc.) tienen su propia animación CSS en loop continuo
        (fv-plane-glide, 2.6s — ver index.css); si el texto rotara cada ~2s
        con el mismo `key` que la escena, React remontaba el SVG entero en
        cada tick de texto y la animación se cortaba a mitad de ciclo antes
        de completar una vuelta — se veía como un parpadeo/salto, no como
        loop fluido. Con `key={slide.scene}`, la escena solo remonta cuando
        de verdad cambia (tema↔avión alternando, o al entrar/salir) — el
        texto rotando por debajo no la interrumpe.
      */}
      <div key={slide.scene} className="fv-scene-swap flex items-center gap-[11px]">
        <SceneComponent className="h-[42px] w-auto" />
        {mostrarTexto && (
          <span className="min-h-[20px] text-[13.5px] text-muted-foreground">{slide.text}</span>
        )}
      </div>
    </div>
  );
}
