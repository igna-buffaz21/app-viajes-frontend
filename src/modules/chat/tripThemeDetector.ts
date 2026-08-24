// src/modules/chat/tripThemeDetector.ts
/**
 * Heurística FRÁGIL para detectar qué tipo de viaje está armando el usuario
 * a partir de texto libre, y así elegir qué microescena mostrar (ver
 * Animaciones.html). Basada en listas de palabras clave en español — mismo
 * enfoque y mismas salvedades que messageParser.ts.
 *
 * Alcance de esta primera versión (decidido con el usuario 2026-08-24):
 * - Solo 6 escenas: playa, montaña/nieve (fusionadas), ciudad, gastronomía,
 *   aventura, y "default" (maleta en cinta, #02 de Animaciones.html).
 * - NO detecta contexto de grupo (amigos/pareja, escenas #06/#07 del
 *   archivo) — quedó fuera de alcance a propósito, se puede sumar después.
 * - NO usa la escena "01 · Búsqueda de viaje" del archivo (avión); "default"
 *   es un único estado neutro, no la cascada de 2 pasos que documenta
 *   Animaciones.html.
 *
 * Camino de reemplazo futuro: si algún día MS1 empieza a completar
 * `PerfilViaje.preferencias` (ver chat.types.ts — el campo ya existe en el
 * contrato, hoy no lo llena ningún backend real, ver AUDITORIA_BACKEND.md),
 * pasá ese objeto como segundo argumento de `detectTripTheme`. Hoy es solo
 * un respaldo cuando el texto no matchea nada (ver comentario de la función
 * para el porqué), pero evita reescribir este archivo entero: el día que el
 * back mande señales estructuradas confiables y con orden temporal claro,
 * alcanza con invertir la prioridad y vaciar `detectThemeInText`.
 */

import type { ChatMessage, PerfilViaje } from "./chat.types";

export type TripTheme = "default" | "beach" | "mountain" | "city" | "food" | "adventure";

type ContextualTheme = Exclude<TripTheme, "default">;

type StructuredTripSignals = Pick<
  NonNullable<PerfilViaje["preferencias"]>,
  "clima" | "tipoViaje" | "intereses" | "gastronomia"
>;

const THEME_KEYWORDS: Record<ContextualTheme, string[]> = {
  beach: ["playa", "mar", "costa", "verano", "calor", "sol", "caribe", "bronceado"],
  mountain: ["montaña", "montana", "nieve", "esqui", "esquí", "frio", "frío", "cordillera", "nevado"],
  city: ["ciudad", "urbano", "capital", "metropoli", "metrópoli", "shopping", "museos"],
  food: ["gastronomia", "gastronomía", "comida", "culinario", "vinos", "restaurantes"],
  adventure: ["aventura", "mochilero", "trekking", "backpacking", "explorar"],
};

function stripDiacritics(text: string): string {
  return text.normalize("NFD").replace(/[̀-ͯ]/g, "");
}

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Cuenta cuántas palabras clave distintas matchean, y en qué posición aparece la primera. */
function countKeywordHits(normalizedText: string, keywords: string[]): { count: number; firstIndex: number } {
  let count = 0;
  let firstIndex = Infinity;
  for (const keyword of keywords) {
    const match = new RegExp(`\\b${escapeRegExp(stripDiacritics(keyword))}\\b`, "i").exec(normalizedText);
    if (match) {
      count++;
      firstIndex = Math.min(firstIndex, match.index);
    }
  }
  return { count, firstIndex };
}

/**
 * Desempate cuando un mensaje matchea más de una categoría (ej. "playa pero
 * también ciudad"): gana la que tiene más palabras clave encontradas: si hay
 * empate, gana la que aparece primero en el texto. Se eligió esta combinación
 * (en vez de solo "primera que aparece") porque es más informativa sin dejar
 * de ser determinística y simple de mantener.
 */
function detectThemeInText(text: string): ContextualTheme | null {
  const normalized = stripDiacritics(text.toLowerCase());
  let best: { theme: ContextualTheme; count: number; firstIndex: number } | null = null;

  for (const [theme, keywords] of Object.entries(THEME_KEYWORDS) as [ContextualTheme, string[]][]) {
    const { count, firstIndex } = countKeywordHits(normalized, keywords);
    if (count === 0) continue;
    if (!best || count > best.count || (count === best.count && firstIndex < best.firstIndex)) {
      best = { theme, count, firstIndex };
    }
  }

  return best?.theme ?? null;
}

/** Bypass de regex para cuando el perfil ya trae señales estructuradas (ver nota arriba). */
function detectThemeFromStructured(signals: StructuredTripSignals | null | undefined): ContextualTheme | null {
  if (!signals) return null;

  if (signals.gastronomia === "bastante" || signals.gastronomia === "prioridad") return "food";

  const tags = [...(signals.clima ?? []), ...(signals.tipoViaje ?? []), ...(signals.intereses ?? [])].map((tag) =>
    stripDiacritics(tag.toLowerCase()),
  );
  if (tags.length === 0) return null;

  let best: { theme: ContextualTheme; count: number } | null = null;
  for (const [theme, keywords] of Object.entries(THEME_KEYWORDS) as [ContextualTheme, string[]][]) {
    const normalizedKeywords = keywords.map(stripDiacritics);
    const count = tags.filter((tag) => normalizedKeywords.some((keyword) => tag.includes(keyword))).length;
    if (count > 0 && (!best || count > best.count)) best = { theme, count };
  }

  return best?.theme ?? null;
}

/**
 * Recorre los mensajes del usuario en orden y devuelve la escena a mostrar.
 * Un mensaje posterior que matchea una categoría distinta actualiza el tema
 * (el usuario cambió de idea); un mensaje sin match no resetea el tema ya
 * detectado. `preferencias` estructuradas se usan solo como respaldo cuando
 * el texto no dio ningún match: se probó darle prioridad al revés (lo
 * estructurado por sobre el texto) pero `intereses`/`clima` del backend son
 * listas ACUMULADAS de toda la conversación, no del último mensaje — con esa
 * prioridad un cambio de opinión posterior en el chat quedaba "pisado" por
 * el primer interés que se había detectado. El texto reciente es más
 * confiable para reflejar la intención actual del usuario.
 */
export function detectTripTheme(messages: ChatMessage[], preferencias?: StructuredTripSignals | null): TripTheme {
  let current: TripTheme = "default";
  for (const message of messages) {
    if (message.role !== "usuario") continue;
    const detected = detectThemeInText(message.contenido);
    if (detected) current = detected;
  }
  if (current !== "default") return current;

  return detectThemeFromStructured(preferencias) ?? "default";
}
