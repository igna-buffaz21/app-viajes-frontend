import { getChatMode } from "./chat.config";
import { enviarMensajeMock } from "./chat.mock.adapter";
import { enviarMensajeReal } from "./chat.real.adapter";
import type { ChatMessage, ChatRespuesta } from "./chat.types";

export const chatService = {
  async enviarMensaje(historial: ChatMessage[], usuarioId?: string): Promise<ChatRespuesta> {
    if (getChatMode() === "mock") {
      return enviarMensajeMock(historial);
    }

    return enviarMensajeReal(historial, usuarioId);
  },
};
