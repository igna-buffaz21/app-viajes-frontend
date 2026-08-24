// Persiste qué conversación quedó activa por usuario, para no perderla al
// recargar la página (antes se guardaba solo en estado de React). Sin esto,
// cada reload mandaba el mensaje sin conversacionId y el backend retomaba
// silenciosamente la última "en_progreso" (ver conversacion.service.ts).
const STORAGE_PREFIX = "freevago.chat.conversacionId.";

export function getConversacionActiva(usuarioId: string): string | null {
  return localStorage.getItem(STORAGE_PREFIX + usuarioId);
}

export function setConversacionActiva(usuarioId: string, conversacionId: string): void {
  localStorage.setItem(STORAGE_PREFIX + usuarioId, conversacionId);
}

export function limpiarConversacionActiva(usuarioId: string): void {
  localStorage.removeItem(STORAGE_PREFIX + usuarioId);
}
