export type AuthMode = "clerk" | "local";

/**
 * Ya tenemos Publishable Key real de Clerk (instancia FreeVago,
 * current-krill-88) y el gateway de Grupo 1 expone GET /api/me con
 * requireAuth real — confirmado corriendo el gateway localmente
 * (TP-Grupo-1-Clerk-Gateway/Back) contra MS1/MS2/MS3. Por eso el default
 * pasa a "clerk".
 *
 * VITE_AUTH_MODE=local queda como válvula de emergencia: si el gateway se
 * cae o Clerk tiene un problema, se puede volver a modo local sin tocar
 * código, solo cambiando esa variable en el .env.
 */
export function getAuthMode(): AuthMode {
  const explicit = import.meta.env.VITE_AUTH_MODE;

  if (explicit === "clerk" || explicit === "local") {
    return explicit;
  }

  return "clerk";
}
