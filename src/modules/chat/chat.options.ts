// Valores permitidos por campo (contrato B del encargo) — se usan para
// ofrecer chips de respuesta rápida en vez de dejar solo texto libre.
export const OPCIONES_POR_CAMPO: Record<string, string[]> = {
  "preferencias.ritmoViaje": ["tranquilo", "equilibrado", "intenso"],
  "preferencias.vidaNocturna": ["nada", "poca", "bastante", "prioridad"],
  "preferencias.naturaleza": ["nada", "poca", "bastante", "prioridad"],
  "preferencias.gastronomia": ["nada", "poca", "bastante", "prioridad"],
  "preferencias.cultura": ["nada", "poca", "bastante", "prioridad"],
  "preferencias.socializar": ["noImporta", "meGustaria", "prioridad"],
  "transporte.vuelo.clase": ["economica", "premiumEconomy", "business", "primeraClase"],
  "transporte.vuelo.escalas": ["sinEscalas", "maxUna", "indiferente"],
};
