import axios from "axios";

/**
 * DolarApi (https://dolarapi.com) — pública, sin key. Uso la cotización
 * "oficial" (no blue/cripto/tarjeta, más volátiles) como referencia estable
 * para estimar presupuestos, no para una transacción real — por eso alcanza
 * con un solo valor (`venta`) en vez de manejar compra/venta por separado.
 *
 * Se usa axios "pelado" (no la instancia `api` de src/lib/axios.ts) a
 * propósito: esa instancia tiene el interceptor que le pega el token de
 * Clerk a cada request (ver src/lib/interceptor.ts) — DolarApi es un
 * servicio de terceros público, no debe recibir ese header.
 */
const DOLARAPI_URL = "https://dolarapi.com/v1/dolares/oficial";
const CACHE_KEY = "freevago.dolarOficial";

interface DolarApiResponse {
  moneda: string;
  casa: string;
  nombre: string;
  compra: number;
  venta: number;
  fechaActualizacion: string;
}

export interface CotizacionDolar {
  venta: number;
  fechaActualizacion: string;
  /** Cuándo se guardó este valor acá (para poder avisar "cotización de hace X" si viene del cache). */
  obtenidaEn: string;
}

// Memoizado en el módulo: una vez resuelta en la sesión del tab, no se
// vuelve a pedir aunque /resultados se monte de nuevo (ej. "Nueva conversación" → volver).
let enMemoria: CotizacionDolar | null = null;

function leerCache(): CotizacionDolar | null {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    return raw ? (JSON.parse(raw) as CotizacionDolar) : null;
  } catch {
    // sessionStorage puede tirar en navegación privada/con storage bloqueado — no es crítico.
    return null;
  }
}

function guardarCache(cotizacion: CotizacionDolar): void {
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify(cotizacion));
  } catch {
    // Idem — si falla, sigue funcionando desde la memoria del módulo por el resto de la sesión.
  }
}

/**
 * Nunca lanza: si DolarApi falla y no hay nada en cache (ni en memoria ni en
 * sessionStorage), devuelve null — quien llama decide el criterio de
 * fallback (ver resultados.desdeEncuesta.ts / results.page.tsx), acá solo
 * se resuelve el dato.
 */
export async function obtenerCotizacionDolar(): Promise<CotizacionDolar | null> {
  if (enMemoria) return enMemoria;

  const cacheada = leerCache();
  if (cacheada) {
    enMemoria = cacheada;
    return cacheada;
  }

  try {
    const response = await axios.get<DolarApiResponse>(DOLARAPI_URL, { timeout: 6000 });
    const cotizacion: CotizacionDolar = {
      venta: response.data.venta,
      fechaActualizacion: response.data.fechaActualizacion,
      obtenidaEn: new Date().toISOString(),
    };
    enMemoria = cotizacion;
    guardarCache(cotizacion);
    return cotizacion;
  } catch {
    return null;
  }
}

export function convertirUsdAArs(montoUsd: number, cotizacion: CotizacionDolar): number {
  return Math.round(montoUsd * cotizacion.venta);
}

export function convertirArsAUsd(montoArs: number, cotizacion: CotizacionDolar): number {
  return Math.round(montoArs / cotizacion.venta);
}
