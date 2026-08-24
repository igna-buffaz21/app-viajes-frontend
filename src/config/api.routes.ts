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
  },
} as const;