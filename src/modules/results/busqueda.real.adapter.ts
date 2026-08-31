import { api } from "@/lib/axios";
import { API_ROUTES } from "@/config/api.routes";

import type { BusquedaParams, RawBusquedaMs2Response, Sugerencia, SugerenciasMs2Response } from "./results.types";

/**
 * CONFIRMADO EN RUNTIME (2026-08-31) — no es documentación de Team 3 sin
 * probar: cloné github.com/Luca-237/FREEVAGO (ms2-scraping) en
 * C:\Proyectos\FREEVAGO-grupo3, lo levanté local con su propio .env
 * (MONGO_URI + API_NINJAS_KEY reales) en el puerto 3003, y probé los tres
 * endpoints con curl directo (no a través de este front). Los shapes de
 * abajo (BusquedaParams, RawBusquedaMs2Response, SugerenciasMs2Response) son
 * los que realmente devolvió/esperó el servidor, no una suposición.
 *
 * Ese repo (ms2-scraping/ y ms3-armado/) es de Grupo 3 — se clonó para
 * probar, pero es de solo lectura: no se le toca ni una línea, ni siquiera
 * para ajustar algo que parezca un bug. Cualquier corrección va del lado de
 * este adapter, nunca del backend.
 */
export async function chequearSaludBusqueda(): Promise<boolean> {
  try {
    const response = await api.get(API_ROUTES.busqueda.health, { timeout: 5000 });
    return response.status >= 200 && response.status < 300;
  } catch {
    return false;
  }
}

/** GET /api/sugerencias?q= — autocompletado de destino. Devuelve {status, sugerencias}, no un array pelado. */
export async function obtenerSugerencias(query: string): Promise<Sugerencia[]> {
  if (!query.trim()) return [];

  const response = await api.get<SugerenciasMs2Response>(API_ROUTES.busqueda.sugerencias, {
    params: { q: query },
  });

  return response.data.sugerencias;
}

/**
 * POST /api/viaje — vuelos + hoteles + actividades combinados y filtrados
 * por presupuesto, sin persistir. El scraper de vuelos puede tardar
 * 20-90s (15s de espera fija + reintentos) y el de hoteles ~12s más de
 * espera anti-WAF, así que no se pone timeout corto acá: quien llama
 * (busqueda.service.ts) es responsable del estado de carga acorde.
 */
export async function buscarViajeReal(params: BusquedaParams): Promise<RawBusquedaMs2Response> {
  const response = await api.post<RawBusquedaMs2Response>(API_ROUTES.busqueda.buscar, params, {
    timeout: 120_000,
  });

  return response.data;
}
