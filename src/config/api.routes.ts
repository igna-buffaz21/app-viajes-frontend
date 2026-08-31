export const API_ROUTES = {
  auth: {
    me: "/auth/me",
  },
  users: {
    create: "/users",
  },

  travelPlans: {
    generar: "/travel-plans/generar",
  },

  conversaciones: {
    mensaje: "/conversaciones/mensaje",
    listar: "/conversaciones",
    detalle: (id: string) => `/conversaciones/${id}`,
  },

  // NUNCA probados contra un servidor real (ver busqueda.real.adapter.ts) —
  // son los paths tal cual la documentación de Team 3 (MS2), sin verificar.
  busqueda: {
    sugerencias: "/sugerencias",
    buscar: "/viaje",
    vuelos: "/vuelos",
    hoteles: "/hoteles",
    actividades: "/actividades",
    health: "/health",
  },
} as const;