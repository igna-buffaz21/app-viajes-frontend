import { api } from "@/lib/axios";
import { API_ROUTES } from "@/config/api.routes";

import type {
  CrearScrapingResultBody,
  RawScrapingResultResponse,
  RawTravelPlanResponse,
} from "./results.types";

/**
 * CONFIRMADO CON CURL REAL contra ms2-scraping y ms3-armado corriendo local
 * (2026-09-14) — no es la documentación del glosario sin probar, que
 * resultó tener dos cosas desactualizadas (ver hallazgos en el mismo
 * chequeo): decía "ningún microservicio implementa x-internal-key" (MS2 y
 * MS3 sí lo exigen hoy, confirmado con 401 real sin el header) y "MS3 no
 * tiene /health" (sí tiene, en /health y /api/health).
 *
 * El flujo real para armar las 3 propuestas de /resultados es:
 *   1. POST /api/scraping-results {conversacionId, destinos?, pasajeros?}
 *      → persiste vuelos/hoteles/actividades en Mongo, devuelve scrapingResultId
 *   2. POST /api/travels {scrapingId} → Gemini arma 3 propuestas completas
 *      (vuelo + hospedaje + actividades + precio total + resumen)
 *
 * `destinos` casi siempre hace falta mandarlo explícito: MS1 guarda
 * `viaje.destino.lugaresPreferidos` como array de STRINGS (ej. ["Bariloche"],
 * confirmado en runtime hace varias sesiones), pero scrapingResult.service.js
 * de MS2 espera un array de OBJETOS {ciudad, pais} y hace `l.ciudad` sobre
 * cada elemento — con strings eso da `undefined`, la lista queda vacía, y
 * tira VALIDATION_ERROR "La conversación no tiene destino" aunque el destino
 * sí esté cargado. Confirmado reproduciendo el 400 real y arreglándolo con
 * `destinos` explícito en el body. Es un mismatch real entre MS1 y MS2 — no
 * se toca ninguno de los dos repos, se lo esquiva desde acá.
 */
export async function crearScrapingResult(body: CrearScrapingResultBody): Promise<RawScrapingResultResponse> {
  const response = await api.post<RawScrapingResultResponse>(API_ROUTES.scrapingResults.crear, body, {
    // FIX (2026-09-15): 62s fue solo la corrida más rápida que medimos.
    // Reproduciendo el mismo 503 que reportó el usuario, el log real de
    // ms2-scraping mostró corridas de hasta 106775ms (~107s) que SÍ
    // terminaron bien, más al menos 2 intentos que ni siquiera llegaron a
    // loguear un cierre — es decir, superaron el timeout de 120s que tenía
    // el gateway en ese momento (ver "timeout of 120000ms exceeded" en
    // gateway.log). Confirmado que /scraping-results usa `ms2Client` (el
    // cliente estándar, MS2_TIMEOUT), NO el `ms2ClientLong` que ya se había
    // subido para /viaje — son dos configs separadas, no la misma. Subimos
    // MS2_TIMEOUT del gateway a 180s con ese margen real medido; acá va
    // 200s para seguir siendo mayor al del gateway y no cortar antes.
    timeout: 200_000,
  });
  return response.data;
}

export async function crearTravelPlan(scrapingId: string): Promise<RawTravelPlanResponse> {
  const response = await api.post<RawTravelPlanResponse>(
    API_ROUTES.travels.crear,
    { scrapingId },
    {
      // Medido con curl real: 31s (llamada a Gemini). El gateway para esta
      // ruta estaba en 45s (MS3_TIMEOUT) — lo subimos a 90s por el mismo
      // motivo que el de MS2: Gemini puede variar, 45s quedaba justo.
      timeout: 100_000,
    }
  );
  return response.data;
}
