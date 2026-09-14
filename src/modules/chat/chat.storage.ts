// Persiste qué conversación quedó activa por usuario, para no perderla al
// recargar la página (antes se guardaba solo en estado de React). Sin esto,
// cada reload mandaba el mensaje sin conversacionId y el backend retomaba
// silenciosamente la última "en_progreso" (ver conversacion.service.ts).
//
// sessionStorage, no localStorage (2026-09-15): con localStorage, un login
// nuevo de la MISMA cuenta de Google retomaba la última conversación de la
// sesión anterior — porque `usuarioId` (el puente Mongo, ver
// clerkMongoBridge.ts) es estable entre logins de la misma cuenta, no
// cambia como para "despistar" la key. sessionStorage sobrevive un refresh
// (no se pierde el progreso de una conversación en curso) pero se vacía
// solo al cerrarse la pestaña/ventana — para el caso de cerrar sesión y
// volver a loguearse SIN cerrar la pestaña (que sessionStorage por sí solo
// no cubre), useAppAuth.logout() además llama a limpiarConversacionActiva
// explícito. Entre los dos queda cubierto: refresh en medio de un chat no
// pierde nada, pero cualquier login nuevo sí arranca en blanco.
const STORAGE_PREFIX = "freevago.chat.conversacionId.";

export function getConversacionActiva(usuarioId: string): string | null {
  return sessionStorage.getItem(STORAGE_PREFIX + usuarioId);
}

export function setConversacionActiva(usuarioId: string, conversacionId: string): void {
  sessionStorage.setItem(STORAGE_PREFIX + usuarioId, conversacionId);
}

export function limpiarConversacionActiva(usuarioId: string): void {
  sessionStorage.removeItem(STORAGE_PREFIX + usuarioId);
}

// Preferencia de "el historial queda abierto como panel fijo" en desktop
// (ver useIsDesktop.ts) — en mobile el historial siempre arranca cerrado
// (drawer/overlay), esto no aplica ahí.
const HISTORIAL_DESKTOP_KEY = "freevago.chat.historialDesktopAbierto";

export function getHistorialDesktopAbierto(): boolean {
  // Default true: en desktop, la primera vez que alguien entra, el panel
  // arranca abierto (mismo criterio que el historial de esta interfaz de
  // Claude) — recién a partir de que el usuario lo cierra una vez, se
  // recuerda cerrado.
  const guardado = localStorage.getItem(HISTORIAL_DESKTOP_KEY);
  return guardado === null ? true : guardado === "true";
}

export function setHistorialDesktopAbierto(abierto: boolean): void {
  localStorage.setItem(HISTORIAL_DESKTOP_KEY, String(abierto));
}
