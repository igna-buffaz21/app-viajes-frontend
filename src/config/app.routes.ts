export const APP_ROUTES = {
  auth: {
    login: "/login",
    unauthorized: "/unauthorized",
    inactive: "/inactive",
    loginViajes: "/login-viajes",
  },

  chat: {
    root: "/chat",
  },

  resultados: {
    root: "/resultados",
  },
} as const;