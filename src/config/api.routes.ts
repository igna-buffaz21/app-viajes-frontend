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
} as const;