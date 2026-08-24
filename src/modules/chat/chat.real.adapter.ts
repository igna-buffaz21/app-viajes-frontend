import { api } from "@/lib/axios";
import { API_ROUTES } from "@/config/api.routes";

import type { ChatMessage, ChatRespuesta } from "./chat.types";

interface ConversacionBackendResponse extends ChatRespuesta {
  conversacionId: string;
}

let conversacionIdActual: string | undefined;

/**
 * POST /api/conversaciones/mensaje (confirmado con backend, reemplaza al
 * viejo /travel-plans/generar de AUDITORIA_BACKEND.md) mantiene el estado de
 * la conversación del lado del servidor: alcanza con mandar el último
 * mensaje del usuario y el conversacionId que devolvió la respuesta previa
 * para que siga acumulando el mismo `viaje`. La respuesta ya viene en el
 * contrato A/B (mensaje/estado/viaje/preguntas), sin necesidad de parsear
 * texto libre.
 */
export async function enviarMensajeReal(
  historial: ChatMessage[],
  usuarioId?: string
): Promise<ChatRespuesta> {
  if (historial.length <= 1) {
    conversacionIdActual = undefined;
  }

  const ultimoMensaje = historial[historial.length - 1]?.contenido ?? "";

  const response = await api.post<ConversacionBackendResponse>(API_ROUTES.conversaciones.mensaje, {
    usuarioId,
    mensaje: ultimoMensaje,
    conversacionId: conversacionIdActual,
  });

  conversacionIdActual = response.data.conversacionId;

  return {
    mensaje: response.data.mensaje,
    estado: response.data.estado,
    viaje: response.data.viaje,
    preguntas: response.data.preguntas,
    camposFaltantesImportantes: response.data.camposFaltantesImportantes,
  };
}
