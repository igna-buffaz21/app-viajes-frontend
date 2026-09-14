import { enviarMensajeReal, listarConversacionesReal, obtenerConversacionReal } from "./chat.real.adapter";
import type { ChatMessage, ChatRespuesta, ConversacionResumen } from "./chat.types";

export const chatService = {
  async enviarMensaje(
    historial: ChatMessage[],
    usuarioId?: string,
    conversacionId?: string,
    nuevaConversacion?: boolean
  ): Promise<ChatRespuesta> {
    return enviarMensajeReal(historial, usuarioId, conversacionId, nuevaConversacion);
  },

  async listarConversaciones(usuarioId?: string): Promise<ConversacionResumen[]> {
    if (!usuarioId) return [];
    return listarConversacionesReal(usuarioId);
  },

  async obtenerConversacion(conversacionId: string) {
    return obtenerConversacionReal(conversacionId);
  },
};
