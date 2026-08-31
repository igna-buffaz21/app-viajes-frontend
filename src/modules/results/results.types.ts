// CONFIRMADO (2026-08-31): estos nombres de campo (price, legs, rawText,
// name, rating, precioPorPersona, etc.) coinciden 1:1 con el output real de
// ms2-scraping (repo Grupo 3, github.com/Luca-237/FREEVAGO) — verificado
// leyendo src/scrapers/{vuelos,hoteles,actividades}.scraper.js y probando
// POST /api/viaje contra un servidor local real. El ejemplo del encargo
// original resultó ser exacto para estos tres tipos Raw*Opcion — no hicieron
// falta cambios acá. Lo que SÍ difiere es el sobre que los envuelve (ver
// RawBusquedaMs2Response más abajo, distinto de RawBusquedaResponse que usa
// el fixture mock de /resultados).
export interface RawVueloLeg {
  time: string;
  airline: string;
  stops: string;
  layover?: string;
  duration: string;
  route: string;
}

export interface RawVueloOpcion {
  price: string;
  legs: RawVueloLeg[];
  rawText: string;
}

export interface RawHotelOpcion {
  name: string;
  price: string;
  rating: string;
  rawText: string;
}

export interface RawActividadOpcion {
  origen: string;
  titulo: string;
  duracionEstimada: string;
  franjaHoraria: string;
  precioPorPersona: string;
  descripcionBreve: string;
}

export interface RawBusquedaResponse {
  metadata: {
    origen: { input: string; iata: string; nombreIngles: string };
    destino: { input: string; oficial: string; slug: string; iata: string; nombreIngles: string };
    viaje: { ida: string; vuelta: string; pasajeros: number; presupuestoPorPersona: number };
  };
  resultados: {
    vuelos: { totalEncontrados: number; dentroDelPresupuesto: number; opciones: RawVueloOpcion[] };
    hoteles: { totalEncontrados: number; dentroDelPresupuesto: number; opciones: RawHotelOpcion[] };
    actividades: { totalEncontrados: number; dentroDelPresupuesto: number; opciones: RawActividadOpcion[] };
  };
  warnings?: string[];
}

/**
 * Sobre real de POST /api/viaje (ms2-scraping) — CONFIRMADO en runtime
 * (2026-08-31, ver busqueda.real.adapter.ts): distinto del que asume el
 * fixture mock de /resultados (RawBusquedaResponse, arriba). Cada fuente
 * trae su propio `error` (string | null) en vez de un `warnings[]` global —
 * armarViaje() en el service real de MS2 nunca lo devuelve.
 */
export interface RawBusquedaMs2Response {
  status: "success";
  metadata: {
    origen: { nombre: string; iata: string };
    destino: { nombre: string; iata: string; slug: string };
    viaje: { ida: string; vuelta: string | null; pasajeros: number; presupuestoPorPersona: number };
  };
  resultados: {
    vuelos: { totalEncontrados: number; dentroDelPresupuesto: number; opciones: RawVueloOpcion[]; error: string | null };
    hoteles: { totalEncontrados: number; dentroDelPresupuesto: number; opciones: RawHotelOpcion[]; error: string | null };
    actividades: { totalEncontrados: number; dentroDelPresupuesto: number; opciones: RawActividadOpcion[]; error: string | null };
  };
}

/** GET /api/sugerencias?q= (autocompletado de destino, ms2-scraping) — CONFIRMADO en runtime (2026-08-31). */
export interface Sugerencia {
  displayName: string;
  slug: string;
  cityName: string;
  countryName: string;
  iata: string;
}

/** Sobre real de GET /api/sugerencias — CONFIRMADO en runtime (2026-08-31): no es un array pelado. */
export interface SugerenciasMs2Response {
  status: "success";
  sugerencias: Sugerencia[];
}

/** Body que espera POST /api/viaje (ms2-scraping) — CONFIRMADO en runtime (2026-08-31, ver src/services/viaje.service.js del repo Grupo 3). */
export interface BusquedaParams {
  originName: string;
  destinationName: string;
  destinationSlug: string;
  /** Si ya se conoce (ej. viene de la Sugerencia elegida), evita que el backend tenga que resolverla de nuevo. */
  destinationIata?: string;
  departDate: string;
  returnDateStr: string;
  passengers: number;
  budget: number;
}

// Tipos limpios: lo que consumen los componentes visuales, ya parseado.
export interface Precio {
  monto: number;
  moneda: string;
}

export interface Vuelo {
  precio: Precio;
  legs: RawVueloLeg[];
}

export interface Hotel {
  nombre: string;
  precio: Precio;
  rating: number | null;
}

export interface Actividad {
  titulo: string;
  origen: string;
  duracionEstimada: string;
  precio: Precio;
  descripcionBreve: string;
}

export interface BusquedaResultados {
  vuelos: Vuelo[];
  hoteles: Hotel[];
  actividades: Actividad[];
  /** Fuentes que fallaron parcialmente pero no impidieron devolver el resto (ver RawBusquedaResponse.warnings). */
  warnings: string[];
}
