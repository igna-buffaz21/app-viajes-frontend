export type AuthMode = "clerk" | "local";

/**
 * Hoy no hay credenciales reales de Clerk ni soporte de /auth/me en el backend
 * (ver AUDITORIA_BACKEND.md), así que el default es "local" para toda la sesión.
 *
 * TODO: cuando el otro grupo confirme credenciales de Clerk + soporte de /auth/me
 * en MicroServicioGrupo2, alcanza con setear VITE_AUTH_MODE=clerk en el .env del
 * front (no hace falta tocar código de este módulo ni el de modules/auth/*).
 */
export function getAuthMode(): AuthMode {
  const explicit = import.meta.env.VITE_AUTH_MODE;

  if (explicit === "clerk" || explicit === "local") {
    return explicit;
  }

  return "local";
}
