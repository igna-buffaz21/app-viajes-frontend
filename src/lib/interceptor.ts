// src/lib/setupApiInterceptors.ts
//
// Agrega Authorization: Bearer <token real de Clerk> a cada request que sale
// hacia el gateway. App.tsx llama a este setup pasándole getToken() de
// @clerk/react's useAuth() — no hace falta ramificar por AuthMode acá: en
// modo "local" (VITE_AUTH_MODE=local) getToken() simplemente devuelve null
// porque no hay sesión de Clerk activa, así que el header se omite sin
// romper nada (ver session.config.ts para la lógica de modo).

import { api } from "@/lib/axios";

type GetToken = () => Promise<string | null>;

export function setupApiInterceptors(getToken: GetToken) {
  const interceptorId = api.interceptors.request.use(async (config) => {
    const token = await getToken();

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  });

  return () => {
    api.interceptors.request.eject(interceptorId);
  };
}
