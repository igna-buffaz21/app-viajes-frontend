/**
 * FreeVago — mensajes de estado "pensando".
 * Rotación conversacional en primera persona mientras la IA trabaja.
 */
import { useEffect, useRef, useState } from "react";

import type { TripTheme } from "./tripThemeDetector";

export type ThinkingCategory =
  | "analizando"
  | "destinos"
  | "fechas"
  | "presupuesto"
  | "armando"
  | "personalidad";

export interface ThinkingMessage {
  text: string;
  category: ThinkingCategory;
}

export const THINKING_MESSAGES: ThinkingMessage[] = [
  // — analizando el mensaje del usuario —
  { text: "Leyendo tu mensaje…", category: "analizando" },
  { text: "Entendiendo qué buscás…", category: "analizando" },
  { text: "Anotando tus preferencias…", category: "analizando" },
  { text: "Separando lo esencial…", category: "analizando" },
  { text: "Interpretando el tipo de viaje…", category: "analizando" },
  { text: "Detectando cuántos viajan…", category: "analizando" },
  { text: "Tomando nota del estilo…", category: "analizando" },
  { text: "Repasando lo que me contaste…", category: "analizando" },
  { text: "Poniendo tu pedido en contexto…", category: "analizando" },
  { text: "Descifrando el plan ideal…", category: "analizando" },

  // — pensando en destinos —
  { text: "Pensando destinos posibles…", category: "destinos" },
  { text: "Recorriendo la costa mentalmente…", category: "destinos" },
  { text: "Comparando playas y montañas…", category: "destinos" },
  { text: "Buscando lugares con tu onda…", category: "destinos" },
  { text: "Descartando destinos saturados…", category: "destinos" },
  { text: "Midiendo distancias de vuelo…", category: "destinos" },
  { text: "Mirando opciones cerca y lejos…", category: "destinos" },
  { text: "Sumando un destino sorpresa…", category: "destinos" },
  { text: "Evaluando qué tan turístico es…", category: "destinos" },
  { text: "Revisando qué hay alrededor…", category: "destinos" },
  { text: "Buscando joyas menos conocidas…", category: "destinos" },
  { text: "Pesando ciudad contra naturaleza…", category: "destinos" },

  // — fechas, clima, logística —
  { text: "Revisando el clima de la zona…", category: "fechas" },
  { text: "Chequeando temperatura promedio…", category: "fechas" },
  { text: "Viendo si es temporada alta…", category: "fechas" },
  { text: "Pensando el mejor momento para ir…", category: "fechas" },
  { text: "Cruzando fechas con feriados…", category: "fechas" },
  { text: "Buscando días más baratos…", category: "fechas" },
  { text: "Consultando horarios de vuelo…", category: "fechas" },
  { text: "Evitando escalas eternas…", category: "fechas" },
  { text: "Verificando requisitos de ingreso…", category: "fechas" },
  { text: "Mirando el pronóstico extendido…", category: "fechas" },
  { text: "Calculando tiempos de traslado…", category: "fechas" },
  { text: "Ajustando la cantidad de noches…", category: "fechas" },

  // — presupuesto —
  { text: "Cruzando fechas con el presupuesto…", category: "presupuesto" },
  { text: "Calculando el costo por persona…", category: "presupuesto" },
  { text: "Comparando tarifas de vuelo…", category: "presupuesto" },
  { text: "Buscando hoteles que entren…", category: "presupuesto" },
  { text: "Sumando traslados y actividades…", category: "presupuesto" },
  { text: "Convirtiendo a pesos…", category: "presupuesto" },
  { text: "Estirando cada dólar…", category: "presupuesto" },
  { text: "Chequeando qué está incluido…", category: "presupuesto" },
  { text: "Dejando margen para imprevistos…", category: "presupuesto" },
  { text: "Negociando conmigo mismo el total…", category: "presupuesto" },
  { text: "Comparando precio contra distancia…", category: "presupuesto" },

  // — armando la respuesta —
  { text: "Armando tu itinerario…", category: "armando" },
  { text: "Ordenando los días…", category: "armando" },
  { text: "Eligiendo dónde comer…", category: "armando" },
  { text: "Reservando lugar para descansar…", category: "armando" },
  { text: "Puliendo los detalles…", category: "armando" },
  { text: "Armando tres propuestas…", category: "armando" },
  { text: "Escribiendo el resumen…", category: "armando" },
  { text: "Ordenando de mejor a peor…", category: "armando" },
  { text: "Sumando puntos de interés…", category: "armando" },
  { text: "Revisando que todo cierre…", category: "armando" },
  { text: "Últimos ajustes…", category: "armando" },
  { text: "Casi listo, dame un segundo…", category: "armando" },

  // — personalidad (~18%) —
  { text: "Imaginando la playa perfecta…", category: "personalidad" },
  { text: "Sintiendo olor a protector solar…", category: "personalidad" },
  { text: "Envidiando un poco tu viaje…", category: "personalidad" },
  { text: "Consultando con mi brújula…", category: "personalidad" },
  { text: "Escuchando el mar de fondo…", category: "personalidad" },
  { text: "Preparando el mate para el vuelo…", category: "personalidad" },
  { text: "Sacudiendo la arena del mapa…", category: "personalidad" },
  { text: "Pidiendo mesa junto a la ventana…", category: "personalidad" },
  { text: "Guardando lugar en la valija…", category: "personalidad" },
  { text: "Practicando el idioma local…", category: "personalidad" },
  { text: "Haciendo lugar para una siesta…", category: "personalidad" },
];

export const THINKING_TEXTS: string[] = THINKING_MESSAGES.map((m) => m.text);

/**
 * Variantes del mensaje "pensando" cuando ya se detectó un tema de viaje
 * (ver tripThemeDetector.ts). Mismo tono y largo que THINKING_MESSAGES, para
 * que el indicador se sienta como parte del mismo sistema.
 */
export const THEME_THINKING_TEXTS: Record<Exclude<TripTheme, "default">, string[]> = {
  beach: [
    "Recorriendo la costa mentalmente…",
    "Imaginando la playa perfecta…",
    "Sintiendo olor a protector solar…",
    "Escuchando el mar de fondo…",
    "Buscando la mejor vista al mar…",
    "Comparando arena y agua…",
  ],
  mountain: [
    "Recorriendo senderos de montaña…",
    "Midiendo la altura de los picos…",
    "Abrigándome para el frío…",
    "Imaginando el aire de montaña…",
    "Revisando la nieve de la temporada…",
    "Buscando la mejor vista a la cordillera…",
  ],
  city: [
    "Recorriendo calles mentalmente…",
    "Ubicando los mejores barrios…",
    "Revisando el mapa de la ciudad…",
    "Buscando miradores urbanos…",
    "Pensando en museos y plazas…",
    "Calculando distancias entre puntos…",
  ],
  food: [
    "Buscando los mejores restaurantes…",
    "Pensando en qué vas a comer…",
    "Revisando vinos de la zona…",
    "Imaginando el menú perfecto…",
    "Reservando mesa mentalmente…",
    "Saboreando la propuesta…",
  ],
  adventure: [
    "Trazando la próxima aventura…",
    "Revisando senderos para trekking…",
    "Preparando la mochila mentalmente…",
    "Buscando rutas poco transitadas…",
    "Pensando en el próximo desafío…",
    "Calculando kilómetros de caminata…",
  ],
};

/** Pool de mensajes rotativos a usar según el tema de viaje detectado. */
export function thinkingPoolFor(theme: TripTheme): string[] {
  if (theme === "default") return THINKING_TEXTS;
  return THEME_THINKING_TEXTS[theme];
}

/**
 * Mitad "avión" del ciclo cuando hay un tema detectado (ver
 * ThinkingIndicator.tsx) — genérico, compartido por los 5 temas, sobre
 * buscar vuelos/logística en sí (no sobre el destino). Se alterna con
 * THEME_THINKING_TEXTS para que la escena avión↔tema y el mensaje cambien
 * siempre juntos y coherentes.
 */
const PLANE_THINKING_TEXTS: string[] = [
  "Buscando vuelos disponibles…",
  "Comparando aerolíneas…",
  "Revisando horarios de conexión…",
  "Chequeando disponibilidad de asientos…",
  "Cotizando distintas rutas…",
  "Viendo qué aeropuerto conviene…",
  "Afinando el itinerario de vuelo…",
  "Cruzando fechas con la disponibilidad…",
];

export function messagesFor(...categories: ThinkingCategory[]): string[] {
  return THINKING_MESSAGES.filter((m) => categories.includes(m.category)).map((m) => m.text);
}

/** Índice aleatorio distinto del anterior. */
export function nextIndex(current: number, length: number): number {
  if (length < 2) return 0;
  let i = current;
  while (i === current) i = Math.floor(Math.random() * length);
  return i;
}

export interface RotatorOptions {
  minDelay?: number;
  maxDelay?: number;
  pool?: string[];
}

/**
 * Rota mensajes con intervalo aleatorio (1.8–2.5s por defecto), sin repetir
 * el mismo dos veces seguidas. Devuelve la función de limpieza.
 */
export function startThinkingRotator(
  onMessage: (text: string) => void,
  { minDelay = 1800, maxDelay = 2500, pool = THINKING_TEXTS }: RotatorOptions = {}
): () => void {
  let index = Math.floor(Math.random() * pool.length);
  let timer: ReturnType<typeof setTimeout>;
  onMessage(pool[index]);
  const tick = () => {
    timer = setTimeout(() => {
      index = nextIndex(index, pool.length);
      onMessage(pool[index]);
      tick();
    }, minDelay + Math.random() * (maxDelay - minDelay));
  };
  tick();
  return () => clearTimeout(timer);
}

/** Hook de React equivalente, para usar mientras `active` sea true. */
export function useThinkingMessage(active: boolean, options: RotatorOptions = {}): string {
  const pool = options.pool ?? THINKING_TEXTS;
  const [text, setText] = useState<string>(pool[0] ?? THINKING_TEXTS[0]);
  const wasActiveRef = useRef(false);

  // Transición inactivo → activo: sincronizamos el texto ANTES de pintar,
  // en el mismo render en el que cambia `pool` (ej. cambió el tema de
  // viaje detectado). Si dependiéramos solo del efecto de abajo, hay un
  // frame donde el ícono ya muestra la escena nueva pero el texto todavía
  // es el de la sesión anterior (se vio como bug real con respuestas
  // rápidas: escena de playa + texto genérico "Leyendo tu mensaje…").
  if (active && !wasActiveRef.current) {
    setText(pool[Math.floor(Math.random() * pool.length)] ?? THINKING_TEXTS[0]);
  }
  wasActiveRef.current = active;

  useEffect(() => {
    if (!active) return;
    return startThinkingRotator(setText, options);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);
  return text;
}

/** Escena + mensaje de un instante del ciclo de ThinkingIndicator — siempre van juntos (ver startThinkingSlideRotator). */
export interface ThinkingSlide {
  scene: "theme" | "plane";
  text: string;
}

// El ciclo siempre arranca por la mitad "tema" (más informativa apenas se
// detecta uno) — la mitad "avión" recién entra en el primer tick del rotador.
function randomThemeSlide(theme: Exclude<TripTheme, "default">): ThinkingSlide {
  const pool = THEME_THINKING_TEXTS[theme];
  return { scene: "theme", text: pool[Math.floor(Math.random() * pool.length)] };
}

/**
 * Rota escena+mensaje juntos. Sin tema ("default"), se comporta como
 * startThinkingRotator de siempre: solo texto, la escena queda fija en el
 * avión (ThinkingIndicator ya lo maneja así). Con tema detectado, alterna
 * estrictamente tema→avión→tema→avión cada 1.8-2.5s — nunca independiente,
 * para que escena y mensaje siempre estén en el mismo momento del ciclo.
 */
export function startThinkingSlideRotator(
  onSlide: (slide: ThinkingSlide) => void,
  theme: TripTheme,
  { minDelay = 1800, maxDelay = 2500 }: { minDelay?: number; maxDelay?: number } = {}
): () => void {
  if (theme === "default") {
    return startThinkingRotator((text) => onSlide({ scene: "plane", text }), {
      minDelay,
      maxDelay,
      pool: THINKING_TEXTS,
    });
  }

  const themePool = THEME_THINKING_TEXTS[theme];
  const planePool = PLANE_THINKING_TEXTS;
  let themeIndex = Math.floor(Math.random() * themePool.length);
  let planeIndex = Math.floor(Math.random() * planePool.length);
  let turno: "theme" | "plane" = "theme";
  let timer: ReturnType<typeof setTimeout>;

  const emit = () => {
    onSlide(
      turno === "theme" ? { scene: "theme", text: themePool[themeIndex] } : { scene: "plane", text: planePool[planeIndex] }
    );
  };

  emit();
  const tick = () => {
    timer = setTimeout(
      () => {
        if (turno === "theme") {
          planeIndex = nextIndex(planeIndex, planePool.length);
          turno = "plane";
        } else {
          themeIndex = nextIndex(themeIndex, themePool.length);
          turno = "theme";
        }
        emit();
        tick();
      },
      minDelay + Math.random() * (maxDelay - minDelay)
    );
  };
  tick();
  return () => clearTimeout(timer);
}

/** Hook de React equivalente a useThinkingMessage, pero devolviendo escena+mensaje juntos (ver ThinkingIndicator.tsx). */
export function useThinkingSlide(active: boolean, theme: TripTheme): ThinkingSlide {
  const [slide, setSlide] = useState<ThinkingSlide>(() =>
    theme === "default" ? { scene: "plane", text: THINKING_TEXTS[0] } : randomThemeSlide(theme)
  );
  const wasActiveRef = useRef(false);
  const themeRef = useRef(theme);

  // Mismo motivo que useThinkingMessage: sincronizar ANTES de pintar en la
  // transición inactivo→activo (o cambio de tema), para que la primera
  // escena+mensaje ya estén correctos desde el primer frame.
  if (active && (!wasActiveRef.current || themeRef.current !== theme)) {
    setSlide(theme === "default" ? { scene: "plane", text: THINKING_TEXTS[0] } : randomThemeSlide(theme));
  }
  wasActiveRef.current = active;
  themeRef.current = theme;

  useEffect(() => {
    if (!active) return;
    return startThinkingSlideRotator(setSlide, theme);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, theme]);

  return slide;
}
