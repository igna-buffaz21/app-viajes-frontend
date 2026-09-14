export const API_ROUTES = {
  auth: {
    // VITE_API_URL ya incluye "/api" como base — el gateway expone este
    // endpoint como GET /api/me (confirmado contra TP-Grupo-1-Clerk-Gateway,
    // Back/src/routes/me.js). Antes decía "/auth/me", que nunca existió del
    // lado del gateway.
    me: "/me",
  },
  users: {
    create: "/users",
  },

  // "/travel-plans/generar" (contrato viejo, ya deprecado por MS1 según el
  // propio Gateway) se sacó: no lo consumía nada del front, y ya no existe
  // ninguna ruta con ese path en el Gateway actualizado.
  //
  // "/conversaciones/*" → "/survey" (2026-09-13): confirmado contra el
  // Gateway real corriendo local (POST/GET /api/survey) que el path cambió
  // pero el contrato de body/response quedó igual — mismo
  // {usuarioId, mensaje, conversacionId?} → {conversacionId, estado,
  // mensaje, viaje, camposFaltantesImportantes, preguntas} de siempre. No es
  // un supuesto: se probó con curl contra el Gateway antes de este cambio.
  conversaciones: {
    mensaje: "/survey",
    listar: "/survey",
    detalle: (id: string) => `/survey/${id}`,
  },

  // NUNCA probados contra un servidor real (ver busqueda.real.adapter.ts) —
  // son los paths tal cual la documentación de Team 3 (MS2), sin verificar.
  // "buscar" (/viaje) es el orquestador de prueba de MS2 — lo sigue usando
  // /explorar como laboratorio, pero /resultados ya no (ver travelPlan.*).
  busqueda: {
    sugerencias: "/sugerencias",
    buscar: "/viaje",
    vuelos: "/vuelos",
    hoteles: "/hoteles",
    actividades: "/actividades",
    health: "/health",
  },

  // Flujo real de producto para /resultados (CONFIRMADO con curl real
  // 2026-09-14, no es documentación sin probar): MS3 no le pide nada a MS1
  // ni arma su propia búsqueda en MS2 — necesita que el resultado del
  // scraping ya esté persistido. La cadena real es:
  //   POST /api/scraping-results {conversacionId} → scrapingResultId
  //   POST /api/travels {scrapingId} → propuestas armadas (Gemini)
  // Antes /resultados le pegaba directo a /viaje (arriba) — eso da listas
  // sueltas de vuelos/hoteles/actividades sin armar, no las 3 propuestas
  // completas que pide el producto.
  scrapingResults: {
    crear: "/scraping-results",
  },
  travels: {
    crear: "/travels",
  },
} as const;