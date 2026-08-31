import { api } from "@/lib/axios";
import { API_ROUTES } from "@/config/api.routes";

import type {
  ChatMessage,
  ChatRespuesta,
  ConversacionResumen,
  PerfilViaje,
  PreguntaPerfil,
} from "./chat.types";

interface ConversacionBackendResponse {
  conversacionId: string;
  estado: "listoParaBuscar" | "incompleto";
  mensaje: string;
  viaje: PerfilViaje;
  camposFaltantesImportantes: string[];
  preguntas: PreguntaPerfil[];
}

// GET /api/conversaciones/:id devuelve el documento crudo de
// conversacionesViaje: su `estado` es "en_progreso" | "completo" (estado del
// registro), distinto del `estado` "incompleto" | "listoParaBuscar" que
// devuelve cada turno de POST /mensaje (estado del perfil que arma la IA).
interface ConversacionDetalleBackend {
  _id: string;
  estado: "en_progreso" | "completo";
  viaje: PerfilViaje;
  mensajes: { rol: "usuario" | "asistente"; contenido: string; fecha: string }[];
}

/**
 * POST /api/conversaciones/mensaje (confirmado con backend, reemplaza al
 * viejo /travel-plans/generar de AUDITORIA_BACKEND.md) mantiene el estado de
 * la conversación del lado del servidor y ya implementa el contrato de
 * encuesta progresiva (estado/viaje/preguntas, cada una con tipoPregunta).
 * Alcanza con mandar el último mensaje del usuario + el conversacionId que
 * devolvió el turno anterior (lo pasa la página, no una variable de módulo,
 * para poder tener varias conversaciones abiertas — ver chat.storage.ts);
 * no hace falta reenviar todo el historial ni parsear texto libre (ver
 * structuredResponseParser.ts, que seguía existiendo para el otro endpoint).
 *
 * DESAJUSTE CONOCIDO (heredado de antes): el glosario del Gateway (Grupo 1)
 * define userId como el string de Clerk (ej. "user_2abcDEF456ghi"), pero el
 * valor que mandamos acá es el _id de Mongo de nuestro login local
 * (session.local.ts) — son espacios de identificadores distintos. Se
 * resuelve solo cuando se active el modo "clerk" en
 * modules/session/session.config.ts. El endpoint de conversaciones espera
 * `usuarioId` en el body (no en un header), así que ya no hace falta el
 * header `x-user-id` que se mandaba para /travel-plans/generar.
 */
export async function enviarMensajeReal(
  historial: ChatMessage[],
  usuarioId?: string,
  conversacionId?: string,
  nuevaConversacion?: boolean
): Promise<ChatRespuesta> {
  if (!usuarioId) {
    throw new Error("Falta usuarioId para enviar el mensaje");
  }

  const ultimoMensaje = historial[historial.length - 1]?.contenido ?? "";

  const response = await api.post<ConversacionBackendResponse>(API_ROUTES.conversaciones.mensaje, {
    usuarioId,
    mensaje: ultimoMensaje,
    ...(conversacionId ? { conversacionId } : {}),
    ...(nuevaConversacion ? { nuevaConversacion: true } : {}),
  });

  return {
    mensaje: response.data.mensaje,
    estado: response.data.estado,
    viaje: response.data.viaje ?? null,
    preguntas: response.data.preguntas ?? [],
    camposFaltantesImportantes: response.data.camposFaltantesImportantes,
    conversacionId: response.data.conversacionId,
  };
}

/** GET /api/conversaciones?usuarioId=... — para armar el listado de conversaciones y poder cambiar entre ellas. */
export async function listarConversacionesReal(usuarioId: string): Promise<ConversacionResumen[]> {
  const response = await api.get<ConversacionResumen[]>(API_ROUTES.conversaciones.listar, {
    params: { usuarioId },
  });

  return response.data;
}

/** GET /api/conversaciones/:id — trae una conversación completa (mensajes + viaje) para retomarla en el chat. */
export async function obtenerConversacionReal(conversacionId: string): Promise<{
  mensajes: ChatMessage[];
  viaje: PerfilViaje | null;
  estado: ConversacionDetalleBackend["estado"];
}> {
  const response = await api.get<ConversacionDetalleBackend>(
    API_ROUTES.conversaciones.detalle(conversacionId)
  );

  return {
    mensajes: response.data.mensajes.map((m) => ({ role: m.rol, contenido: m.contenido })),
    viaje: response.data.viaje ?? null,
    estado: response.data.estado,
  };
}
