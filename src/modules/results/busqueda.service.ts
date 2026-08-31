import { buscarViajeReal, chequearSaludBusqueda } from "./busqueda.real.adapter";
import { mapBusquedaMs2 } from "./results.mapper";
import type { BusquedaParams, BusquedaResultados } from "./results.types";

/**
 * A diferencia de chat.service.ts, acá NO hay modo mock: el propósito
 * específico de /explorar es demostrar la conexión real a MS2 (scraping de
 * vuelos/hoteles/actividades). Si no hay conexión, tiene que verse
 * claramente que no la hay — no un fixture disfrazado de resultado real.
 */
export type ResultadoBusqueda =
  | { estado: "ok"; datos: BusquedaResultados }
  | { estado: "servicioNoDisponible" }
  | { estado: "error"; mensaje: string };

export const busquedaService = {
  /** Chequeo de salud antes de mostrar el formulario habilitado (ver explorar.page.tsx). */
  async estaDisponible(): Promise<boolean> {
    return chequearSaludBusqueda();
  },

  async buscar(params: BusquedaParams): Promise<ResultadoBusqueda> {
    const disponible = await chequearSaludBusqueda();
    if (!disponible) {
      return { estado: "servicioNoDisponible" };
    }

    try {
      const raw = await buscarViajeReal(params);
      return { estado: "ok", datos: mapBusquedaMs2(raw) };
    } catch {
      return {
        estado: "error",
        mensaje: "No pudimos completar la búsqueda. Probá de nuevo en unos minutos.",
      };
    }
  },
};
