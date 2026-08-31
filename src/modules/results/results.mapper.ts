import type {
  Actividad,
  BusquedaResultados,
  Hotel,
  Precio,
  RawActividadOpcion,
  RawBusquedaMs2Response,
  RawBusquedaResponse,
  RawHotelOpcion,
  RawVueloOpcion,
  Vuelo,
} from "./results.types";

// CONFIRMADO (2026-08-31, ver results.types.ts): los nombres de campo de
// RawVueloOpcion/RawHotelOpcion/RawActividadOpcion coinciden con el output
// real de ms2-scraping — parsePrecio/parseRating/map* de acá abajo aplican
// tal cual a datos reales, no solo al fixture mock.

/**
 * Heurística de moneda: el ejemplo real del encargo mezcla precios "chicos"
 * sin separador de miles (vuelos, ej. "$575" — leídos en la fuente como USD)
 * con precios "grandes" con puntos de miles al estilo argentino (hoteles y
 * actividades, ej. "$ 1.468.134" — ARS). No hay forma de distinguirlos con
 * certeza sin que el backend real indique la moneda explícitamente; esta es
 * una limitación conocida a resolver cuando exista el endpoint real.
 */
export function parsePrecio(raw: string): Precio {
  const limpio = raw.replace(/[^\d.,]/g, "");
  const esMiles = /^\d{1,3}(\.\d{3})+$/.test(limpio);

  if (esMiles) {
    return { monto: Number(limpio.replace(/\./g, "")), moneda: "ARS" };
  }

  return { monto: Number(limpio.replace(/[.,]/g, "")), moneda: "USD" };
}

export function parseRating(raw: string): number | null {
  const numero = Number(raw.replace(",", "."));
  return Number.isFinite(numero) ? numero : null;
}

export function mapVuelo(raw: RawVueloOpcion): Vuelo {
  return { precio: parsePrecio(raw.price), legs: raw.legs };
}

// CONFIRMADO (2026-08-31, contra datos reales): raw.name viene SIEMPRE
// "Comparar" — es el label del botón de comparación de Booking.com, no el
// nombre del hotel. Causa exacta en hoteles.scraper.js de ms2-scraping
// (línea 15): `let name = lines[0]` toma la primera línea del texto
// scrapeado sin filtrar ese caso (solo salta a lines[1] si detecta
// "oferta"/"patrocinado"). Es un bug del scraper, no un campo mal leído acá
// — no se toca ese repo. El nombre real sí está disponible como segundo
// segmento de rawText ("Comparar | <nombre real> | ..."), así que se
// extrae de ahí cuando raw.name es ese valor conocido-inválido; si el
// scraper se corrige más adelante, esto deja de activarse solo (raw.name
// pasa a usarse directo).
const NOMBRE_HOTEL_INVALIDO = /^comparar$/i;

function extraerNombreDesdeRawText(rawText: string): string {
  const segmentos = rawText.split("|").map((s) => s.trim()).filter(Boolean);
  return segmentos[1] ?? segmentos[0] ?? "Hotel sin nombre";
}

export function mapHotel(raw: RawHotelOpcion): Hotel {
  const nombre = NOMBRE_HOTEL_INVALIDO.test(raw.name.trim())
    ? extraerNombreDesdeRawText(raw.rawText)
    : raw.name;

  return { nombre, precio: parsePrecio(raw.price), rating: parseRating(raw.rating) };
}

export function mapActividad(raw: RawActividadOpcion): Actividad {
  return {
    titulo: raw.titulo,
    origen: raw.origen,
    duracionEstimada: raw.duracionEstimada,
    precio: parsePrecio(raw.precioPorPersona),
    descripcionBreve: raw.descripcionBreve,
  };
}

export function mapBusqueda(raw: RawBusquedaResponse): BusquedaResultados {
  return {
    vuelos: raw.resultados.vuelos.opciones.map(mapVuelo),
    hoteles: raw.resultados.hoteles.opciones.map(mapHotel),
    actividades: raw.resultados.actividades.opciones.map(mapActividad),
    warnings: raw.warnings ?? [],
  };
}

/**
 * Para el sobre real de POST /api/viaje (ms2-scraping) — distinto de
 * mapBusqueda() de arriba porque cada fuente trae su propio `error` en vez
 * de un `warnings[]` global (ver RawBusquedaMs2Response). Reusa los mappers
 * por ítem tal cual: el shape de cada opción (vuelo/hotel/actividad) es
 * idéntico entre el fixture mock y los datos reales, confirmado en runtime.
 */
export function mapBusquedaMs2(raw: RawBusquedaMs2Response): BusquedaResultados {
  const { vuelos, hoteles, actividades } = raw.resultados;
  const warnings = [vuelos.error, hoteles.error, actividades.error].filter(
    (error): error is string => Boolean(error)
  );

  return {
    vuelos: vuelos.opciones.map(mapVuelo),
    hoteles: hoteles.opciones.map(mapHotel),
    actividades: actividades.opciones.map(mapActividad),
    warnings,
  };
}
