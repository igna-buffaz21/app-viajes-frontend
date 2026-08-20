// Valores permitidos por campo (contrato B del encargo) — se usan para
// ofrecer chips de respuesta rápida en vez de dejar solo texto libre.
// `multiple: true` son campos array (selección múltiple + botón de
// confirmar); `multiple: false` son campos de valor único (click = envío
// inmediato). Los campos sin entrada acá quedan como texto libre puro.
export interface OpcionesCampo {
  opciones: string[];
  multiple: boolean;
}

export const OPCIONES_POR_CAMPO: Record<string, OpcionesCampo> = {
  "preferencias.ritmoViaje": { opciones: ["tranquilo", "equilibrado", "intenso"], multiple: false },
  "preferencias.vidaNocturna": { opciones: ["nada", "poca", "bastante", "prioridad"], multiple: false },
  "preferencias.naturaleza": { opciones: ["nada", "poca", "bastante", "prioridad"], multiple: false },
  "preferencias.gastronomia": { opciones: ["nada", "poca", "bastante", "prioridad"], multiple: false },
  "preferencias.cultura": { opciones: ["nada", "poca", "bastante", "prioridad"], multiple: false },
  "preferencias.socializar": { opciones: ["noImporta", "meGustaria", "prioridad"], multiple: false },
  "transporte.vuelo.clase": { opciones: ["economica", "premiumEconomy", "business", "primeraClase"], multiple: false },
  "transporte.vuelo.escalas": { opciones: ["sinEscalas", "maxUna", "indiferente"], multiple: false },
  "viajeros.personas[].tipo": { opciones: ["adulto", "menor", "bebe"], multiple: false },
  "preferencias.tipoViaje": {
    opciones: ["relax", "playa", "aventura", "cultural", "gastronomico", "naturaleza"],
    multiple: true,
  },
  "preferencias.intereses": {
    opciones: ["playa", "montaña", "naturaleza", "cultura", "gastronomia", "vida nocturna"],
    multiple: true,
  },
  "preferencias.clima": { opciones: ["calido", "templado", "frio"], multiple: true },
};
