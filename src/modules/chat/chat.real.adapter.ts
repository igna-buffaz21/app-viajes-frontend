import { api } from "@/lib/axios";
import { API_ROUTES } from "@/config/api.routes";

import type { ChatMessage, ChatRespuesta } from "./chat.types";
import { parseRespuestaEstructurada } from "./structuredResponseParser";

interface TravelPlanBackendResponse {
  _id: string;
  prompt: string;
  geminiPrompt: string;
  respuesta: string;
  createdAt: string;
  updatedAt: string;
}

function construirPrompt(historial: ChatMessage[]): string {
  const transcripcion = historial
    .map((m) => `${m.role === "usuario" ? "Usuario" : "Asistente"}: ${m.contenido}`)
    .join("\n");

  return `Sos un asistente de planificación de viajes. Esta es la conversación hasta ahora:\n\n${transcripcion}\n\nRespondé al último mensaje del usuario de forma conversacional, ayudándolo a definir su viaje.`;
}

/**
 * POST /api/travel-plans/generar no mantiene estado de conversación (ver
 * AUDITORIA_BACKEND.md): cada llamada es un evento aislado. Para simular un
 * chat con memoria, reenviamos el historial completo como "prompt" en cada
 * mensaje.
 *
 * `respuesta` es hoy texto libre de Gemini, pero se intenta primero
 * interpretarlo como el contrato de encuesta progresiva ya confirmado con
 * backend (ver structuredResponseParser.ts) — todavía no implementado del
 * otro lado, así que en la práctica esto siempre cae al fallback de abajo
 * ("estado" incompleto, sin preguntas estructuradas) hasta que lo activen.
 */
export async function enviarMensajeReal(
  historial: ChatMessage[],
  usuarioId?: string
): Promise<ChatRespuesta> {
  const prompt = construirPrompt(historial);

  // x-user-id: header que va a inyectar el API Gateway de Grupo 1 (ver
  // GLOSARIO_DOMINIO.md) — nombre confirmado, pero el Gateway todavía no está
  // conectado, así que hoy MicroServicioGrupo2 lo recibe y lo ignora (ningún
  // controller lee headers para identificar usuario, auditado línea por
  // línea). DESAJUSTE CONOCIDO: el glosario define userId como el string de
  // Clerk (ej. "user_2abcDEF456ghi"), pero el valor que mandamos acá es el
  // _id de Mongo de nuestro login local (session.local.ts) — son espacios de
  // identificadores distintos. Se resuelve solo cuando se active el modo
  // "clerk" en modules/session/session.config.ts.
  const response = await api.post<TravelPlanBackendResponse>(
    API_ROUTES.travelPlans.generar,
    { prompt },
    usuarioId ? { headers: { "x-user-id": usuarioId } } : undefined
  );

  const estructurada = parseRespuestaEstructurada(response.data.respuesta);
  if (estructurada) return estructurada;

  return {
    mensaje: response.data.respuesta,
    estado: "incompleto",
    viaje: null,
    preguntas: [],
  };
}
