import { getChatMode } from "./chat.config";
import { enviarMensajeMock } from "./chat.mock.adapter";
import { enviarMensajeReal, listarConversacionesReal, obtenerConversacionReal } from "./chat.real.adapter";
import type { ChatMessage, ChatRespuesta, ConversacionResumen } from "./chat.types";

// El mock es 100% síncrono (sin red real), así que sin esta demora
// artificial el estado "pensando" de ThinkingIndicator dura milisegundos —
// imperceptible para un humano, aunque el detector de tema funcione bien.
// El "modo demo" existe justamente para mostrarle la app a alguien, así que
// necesita sentirse como una respuesta real.
const MOCK_DELAY_MS = 1200;

export const chatService = {
  async enviarMensaje(
    historial: ChatMessage[],
    usuarioId?: string,
    conversacionId?: string,
    nuevaConversacion?: boolean
  ): Promise<ChatRespuesta> {
    if (getChatMode() === "mock") {
      const [respuesta] = await Promise.all([
        enviarMensajeMock(historial),
        new Promise((resolve) => setTimeout(resolve, MOCK_DELAY_MS)),
      ]);
      return respuesta;
    }

    return enviarMensajeReal(historial, usuarioId, conversacionId, nuevaConversacion);
  },

  // El listado y la carga de una conversación puntual dependen de
  // persistencia real en Mongo: en modo mock (sin backend) no hay nada que
  // listar, así que devuelven vacío/null en vez de simular historial falso.
  async listarConversaciones(usuarioId?: string): Promise<ConversacionResumen[]> {
    if (getChatMode() === "mock" || !usuarioId) return [];
    return listarConversacionesReal(usuarioId);
  },

  async obtenerConversacion(conversacionId: string) {
    if (getChatMode() === "mock") return null;
    return obtenerConversacionReal(conversacionId);
  },
};
