import type {
  Actividad,
  BusquedaResultados,
  Hotel,
  Precio,
  RawActividadOpcion,
  RawBusquedaResponse,
  RawHotelOpcion,
  RawVueloOpcion,
  Vuelo,
} from "./results.types";

// TODO(glosario compartido): este mapper asume los nombres de campo del raw
// contract tal cual figuran en results.types.ts (RawVueloOpcion, RawHotelOpcion,
// RawActividadOpcion) — no confirmados por MS1, sujetos a cambiar cuando se
// cierre el glosario compartido de campos entre front y backend. Si cambian,
// el ajuste es acá adentro (parsePrecio/parseRating/map*); los tipos limpios
// (Vuelo/Hotel/Actividad/Precio) y los componentes visuales no deberían
// necesitar tocarse.

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

export function mapHotel(raw: RawHotelOpcion): Hotel {
  return { nombre: raw.name, precio: parsePrecio(raw.price), rating: parseRating(raw.rating) };
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
  };
}
