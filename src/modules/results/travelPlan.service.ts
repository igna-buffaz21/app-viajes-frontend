import axios from "axios";

import { chequearSaludBusqueda } from "./busqueda.real.adapter";
import { crearScrapingResult, crearTravelPlan } from "./travelPlan.adapter";
import { mapTravelPlan } from "./travelPlan.mapper";
import type { CrearScrapingResultBody, Propuesta, ScrapingResultWarning } from "./results.types";

export type ResultadoTravelPlan =
  | { estado: "ok"; propuestas: Propuesta[]; warnings: string[] }
  | { estado: "servicioNoDisponible" }
  | { estado: "error"; mensaje: string };

function warningsATexto(warnings: ScrapingResultWarning[]): string[] {
  return warnings.map((w) => `${w.tipo} en ${w.destino}: ${w.error}`);
}

function mensajeDeError(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const mensajeBackend = err.response?.data?.error?.message;
    if (typeof mensajeBackend === "string") return mensajeBackend;
  }
  return "No pudimos armar las propuestas de viaje. Probá de nuevo en unos minutos.";
}

function esErrorReintentable(err: unknown): boolean {
  return axios.isAxiosError(err) && !err.response;
}

const MAX_INTENTOS = 3;

async function conReintentos<T>(fn: () => Promise<T>, etiqueta: string): Promise<T> {
  let ultimoError: unknown;
  for (let intento = 1; intento <= MAX_INTENTOS; intento++) {
    try {
      return await fn();
    } catch (err) {
      ultimoError = err;
      if (intento === MAX_INTENTOS || !esErrorReintentable(err)) throw err;
      console.warn(
        `[travelPlanService] ${etiqueta}: intento ${intento}/${MAX_INTENTOS} falló (timeout/conexión), reintentando...`,
        err
      );
    }
  }
  // Inalcanzable (el loop siempre retorna o tira antes) — solo para que TS sepa que la función retorna T.
  throw ultimoError;
}

/**
 * Orquesta el flujo real de /resultados: persistir el scraping (MS2) y
 * pasarle esa referencia a MS3 para que arme las 3 propuestas completas con
 * Gemini — ver travelPlan.adapter.ts para la evidencia de por qué es este
 * flujo y no pegarle directo a /viaje (eso es lo que sigue usando
 * /explorar, con busqueda.service.ts, sin cambios).
 *
 * Cada paso reintenta hasta 3 veces por su cuenta (no el flujo entero desde
 * cero) — si el scraping ya se persistió bien y falla recién el armado con
 * MS3, no tiene sentido volver a scrapear todo de nuevo. El caller
 * (results.page.tsx) no necesita saber nada de esto: mientras dure,
 * `estado: "buscando"` sigue mostrando el mismo ThinkingIndicator — recién
 * se pasa a la pantalla de error si los 3 intentos de un mismo paso fallan.
 */
export const travelPlanService = {
  async armarPropuestas(input: CrearScrapingResultBody): Promise<ResultadoTravelPlan> {
    const disponible = await chequearSaludBusqueda();
    if (!disponible) {
      return { estado: "servicioNoDisponible" };
    }

    try {
      const scraping = await conReintentos(() => crearScrapingResult(input), "POST /scraping-results");
      const travelPlan = await conReintentos(
        () => crearTravelPlan(scraping.scrapingResultId),
        "POST /travels"
      );
      return {
        estado: "ok",
        propuestas: mapTravelPlan(travelPlan),
        warnings: warningsATexto(scraping.warnings),
      };
    } catch (err) {
      return { estado: "error", mensaje: mensajeDeError(err) };
    }
  },
};
