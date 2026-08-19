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

  panel: {
    root: "/panel",
    users: "/panel/users",
    incidents: "/panel/incidents",
    municipalities: "/panel/municipalities",
  },

  operator: {
    root: "/operator",
    incidents: "/operator/incidents",
    tasks: "/operator/tasks",
  },

  app: {
    root: "/app",
    report: "/app/report",
    myReports: "/app/my-reports",
    profile: "/app/profile",
  },
} as const;