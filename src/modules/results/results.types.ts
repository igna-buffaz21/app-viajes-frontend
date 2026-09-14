// CONFIRMADO (2026-08-31): estos nombres de campo (price, legs, rawText,
// name, rating, precioPorPersona, etc.) coinciden 1:1 con el output real de
// ms2-scraping (repo Grupo 3, github.com/Luca-237/FREEVAGO) — verificado
// leyendo src/scrapers/{vuelos,hoteles,actividades}.scraper.js y probando
// POST /api/viaje contra un servidor local real.
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

/**
 * Sobre real de POST /api/viaje (ms2-scraping) — CONFIRMADO en runtime
 * (2026-08-31, ver busqueda.real.adapter.ts). Cada fuente trae su propio
 * `error` (string | null) en vez de un `warnings[]` global — armarViaje()
 * en el service real de MS2 nunca lo devuelve.
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
  /** Fuentes que fallaron parcialmente pero no impidieron devolver el resto (ver RawBusquedaMs2Response). */
  warnings: string[];
}

// ============================================================================
// Flujo real de /resultados: POST /api/scraping-results → POST /api/travels
// CONFIRMADO con curl real contra ms2-scraping y ms3-armado corriendo local
// (2026-09-14), no es documentación sin probar. Ver travelPlan.adapter.ts.
// ============================================================================

/** Body real de POST /api/scraping-results. `destinos` casi siempre hace falta como override explícito — ver el comentario largo en travelPlan.adapter.ts sobre por qué. */
export interface CrearScrapingResultBody {
  conversacionId: string;
  destinos?: string[];
  pasajeros?: number;
}

/** Warning por destino/fuente que devuelve POST /api/scraping-results — distinto de BusquedaResultados.warnings (ahí son strings sueltos). */
export interface ScrapingResultWarning {
  destino: string;
  tipo: "vuelos" | "hoteles" | "actividades";
  error: string;
}

/**
 * Response real de POST /api/scraping-results (ms2-scraping). Solo se usa
 * `scrapingResultId` (para pasárselo a POST /api/travels) — `scrapingResult`
 * se tipa laxo a propósito: sus vuelos/hoteles/actividades NO tienen el
 * mismo shape que RawVueloOpcion/RawHotelOpcion/RawActividadOpcion de
 * /viaje (confirmado leyendo scrapingResult.service.js de ms2-scraping —
 * ej. actividades ahí usa `nombre/descripcion/precio/categoria`, no
 * `titulo/descripcionBreve/precioPorPersona/origen`), y nada de la UI de
 * /resultados lo renderiza directo.
 */
export interface RawScrapingResultResponse {
  status: "success";
  scrapingResultId: string;
  scrapingResult: {
    destinos: string[];
    conversacionViajeId: string;
    _id: string;
    [key: string]: unknown;
  };
  warnings: ScrapingResultWarning[];
}

/** vuelo/hospedaje dentro de una propuesta armada por Gemini (ms3-armado) — CONFIRMADO en runtime, no el schema Mongoose (que solo dice "Mixed"). */
export interface RawPropuestaVuelo {
  precio: number;
  /** false = MS2 no encontró vuelos reales para esta ruta y Gemini estimó un precio de referencia — hay que aclararlo en la UI, no mostrarlo como un vuelo real. */
  esReal: boolean;
  aerolinea: string;
  origen: string;
  destino: string;
  fechaIda: string;
  fechaVuelta: string;
  detalle: string;
}

export interface RawPropuestaHospedaje {
  precio: number;
  nombre: string;
  /** String con coma decimal ("9,1"), igual que RawHotelOpcion.rating — reusar parseRating. */
  puntuacion: string;
  detalle: string;
}

export interface RawPropuestaActividad {
  nombre: string;
  descripcion: string;
  precio: number;
}

export interface RawPropuesta {
  destino: string;
  vuelo: RawPropuestaVuelo;
  hospedaje: RawPropuestaHospedaje;
  actividades: RawPropuestaActividad[];
  precioEstimado: number;
  moneda: string;
  resumen: string;
}

/** Response real de POST /api/travels (ms3-armado) — siempre exactamente 3 propuestas (validador Mongoose del lado de MS3). */
export interface RawTravelPlanResponse {
  status: "success";
  travelPlan: {
    userId: string;
    scrapingResultId: string;
    conversacionViajeId: string;
    destinos: string[];
    propuestas: RawPropuesta[];
    geminiModel: string;
    _id: string;
  };
}

// ---- Tipos limpios para los componentes visuales ----

export interface PropuestaVuelo {
  precio: number;
  esReal: boolean;
  aerolinea: string;
  origen: string;
  destino: string;
  fechaIda: string;
  fechaVuelta: string;
  detalle: string;
}

export interface PropuestaHospedaje {
  precio: number;
  nombre: string;
  puntuacion: number | null;
  detalle: string;
}

export interface PropuestaActividad {
  nombre: string;
  descripcion: string;
  precio: number;
}

export interface Propuesta {
  destino: string;
  vuelo: PropuestaVuelo;
  hospedaje: PropuestaHospedaje;
  actividades: PropuestaActividad[];
  precioTotal: Precio;
  resumen: string;
}
