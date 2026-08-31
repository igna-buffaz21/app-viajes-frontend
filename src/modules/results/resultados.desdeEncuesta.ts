import type { PerfilViaje } from "@/modules/chat/chat.types";

import { obtenerSugerencias } from "./busqueda.real.adapter";
import type { BusquedaParams } from "./results.types";

/** Todo lo que arma esta función salvo `budget` — ese se completa en results.page.tsx después de resolver la cotización (ver dolar.service.ts). */
export type ParamsSinPresupuesto = Omit<BusquedaParams, "budget">;

export type ResultadoDesdeEncuesta =
  | { ok: true; params: ParamsSinPresupuesto; presupuestoOriginal: { monto: number; moneda: string } }
  // El usuario dejó que la IA elija destino, pero MS2 necesita uno concreto
  // y no tenemos MS3 para sugerirlo — ver la propuesta acordada 2026-08-31.
  | { ok: false; motivo: "destinoAbierto" }
  | { ok: false; motivo: "faltanDatos"; camposFaltantes: string[] }
  // El destino que la encuesta capturó como texto libre no resolvió a
  // ninguna sugerencia real de MS2 (GET /api/sugerencias sin resultados).
  | { ok: false; motivo: "destinoNoEncontrado"; destinoBuscado: string };

/**
 * Convierte el `viaje` que arma la encuesta del chat (PerfilViaje) en los
 * parámetros que espera POST /api/viaje de MS2 (BusquedaParams). MS2 no
 * tiene autocompletado de origen (solo de destino), así que el origen se
 * manda como texto libre tal cual lo dejó la encuesta; el destino sí
 * necesita resolverse contra /api/sugerencias para conseguir el
 * `destinationSlug` que exige el contrato real.
 */
export async function armarParamsDesdeEncuesta(viaje: PerfilViaje | null): Promise<ResultadoDesdeEncuesta> {
  if (!viaje) {
    return { ok: false, motivo: "faltanDatos", camposFaltantes: ["toda la encuesta"] };
  }

  // CONFIRMADO en runtime (2026-08-31): lugaresPreferidos es un array de
  // strings (ej. ["Miami"]), no de objetos {ciudad, ...} — ver chat.types.ts.
  const destinoElegido = viaje.destino?.lugaresPreferidos?.[0]?.trim();
  if (!destinoElegido) {
    if (viaje.destino?.destinosAbiertos) {
      return { ok: false, motivo: "destinoAbierto" };
    }
    return { ok: false, motivo: "faltanDatos", camposFaltantes: ["destino"] };
  }

  const camposFaltantes: string[] = [];
  if (!viaje.lugarSalida?.ciudad) camposFaltantes.push("ciudad de salida");
  if (!viaje.fechaSalida) camposFaltantes.push("fecha de salida");
  if (!viaje.viajeros?.cantidadTotal) camposFaltantes.push("cantidad de viajeros");
  if (!viaje.presupuesto?.monto) camposFaltantes.push("presupuesto");

  if (camposFaltantes.length > 0) {
    return { ok: false, motivo: "faltanDatos", camposFaltantes };
  }

  // CONFIRMADO (2026-08-31): concatenar "ciudad, país" como query rompe la
  // búsqueda de /api/sugerencias (devuelve []) — probado con curl. Con solo
  // la ciudad sí matchea. No se documentó este comportamiento en ningún
  // lado; es una particularidad del buscador de MS2, no un bug bloqueante,
  // así que se trabaja alrededor mandando solo la ciudad.
  const destinoQuery = destinoElegido;
  const sugerencias = await obtenerSugerencias(destinoQuery);
  const sugerencia = sugerencias[0];

  if (!sugerencia) {
    return { ok: false, motivo: "destinoNoEncontrado", destinoBuscado: destinoQuery };
  }

  return {
    ok: true,
    params: {
      originName: viaje.lugarSalida!.ciudad!,
      destinationName: sugerencia.cityName,
      destinationSlug: sugerencia.slug,
      destinationIata: sugerencia.iata,
      departDate: viaje.fechaSalida!,
      returnDateStr: viaje.fechaFin ?? "",
      passengers: viaje.viajeros!.cantidadTotal!,
    },
    presupuestoOriginal: {
      monto: viaje.presupuesto!.monto!,
      moneda: viaje.presupuesto!.moneda ?? "ARS",
    },
  };
}
