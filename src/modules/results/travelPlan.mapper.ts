import { parseRating } from "./results.mapper";
import type { Propuesta, RawPropuesta, RawTravelPlanResponse } from "./results.types";

/**
 * Las propuestas de MS3 ya vienen con precio/precioEstimado como NUMBER
 * (Gemini los normaliza) — a diferencia de RawVueloOpcion/RawHotelOpcion de
 * MS2, que traen todo como string sin normalizar. Por eso este mapper es
 * más simple que mapVuelo/mapHotel/mapActividad (results.mapper.ts): no
 * hace falta parsePrecio acá, solo parseRating para `puntuacion` (esa sigue
 * viniendo como string con coma decimal, "9,1", igual que RawHotelOpcion.rating).
 */
export function mapPropuesta(raw: RawPropuesta): Propuesta {
  return {
    destino: raw.destino,
    vuelo: {
      precio: raw.vuelo.precio,
      esReal: raw.vuelo.esReal,
      aerolinea: raw.vuelo.aerolinea,
      origen: raw.vuelo.origen,
      destino: raw.vuelo.destino,
      fechaIda: raw.vuelo.fechaIda,
      fechaVuelta: raw.vuelo.fechaVuelta,
      detalle: raw.vuelo.detalle,
    },
    hospedaje: {
      precio: raw.hospedaje.precio,
      nombre: raw.hospedaje.nombre,
      puntuacion: parseRating(raw.hospedaje.puntuacion),
      detalle: raw.hospedaje.detalle,
    },
    actividades: raw.actividades.map((a) => ({
      nombre: a.nombre,
      descripcion: a.descripcion,
      precio: a.precio,
    })),
    precioTotal: { monto: raw.precioEstimado, moneda: raw.moneda },
    resumen: raw.resumen,
  };
}

export function mapTravelPlan(raw: RawTravelPlanResponse): Propuesta[] {
  return raw.travelPlan.propuestas.map(mapPropuesta);
}
