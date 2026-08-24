import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Logo } from "@/components/brand/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { APP_ROUTES } from "@/config/app.routes";
import { prefersReducedMotion } from "@/lib/motion";
import { useTheme } from "@/lib/useTheme";
import { useAppAuth } from "@/modules/session/useAppAuth";

import { getChatMode, setChatMode } from "../chat.config";
import { QuestionCard } from "../components/QuestionCard";
import { chatService } from "../chat.service";
import type { ChatMessage, ChatRespuesta } from "../chat.types";
import { MessageBubble } from "../components/MessageBubble";
import { ThinkingIndicator } from "../components/ThinkingIndicator";
import { SurveySummary } from "../components/SurveySummary";
import { detectTripTheme } from "../tripThemeDetector";

export default function ChatPage() {
  const navigate = useNavigate();
  const { user, logout } = useAppAuth();
  const { theme } = useTheme();

  const [mode, setMode] = useState(getChatMode());
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [ultimaRespuesta, setUltimaRespuesta] = useState<ChatRespuesta | null>(null);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const bottomRef = useRef<HTMLDivElement>(null);

  const tripTheme = useMemo(
    () => detectTripTheme(messages, ultimaRespuesta?.viaje?.preferencias),
    [messages, ultimaRespuesta],
  );

  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: prefersReducedMotion() ? "auto" : "smooth",
      block: "end",
    });
  }, [messages, isSending]);

  const conversacionCompleta = ultimaRespuesta?.estado === "listoParaBuscar";

  async function enviar(contenido: string) {
    if (!contenido.trim() || isSending || conversacionCompleta) return;

    const historial = [...messages, { role: "usuario" as const, contenido }];

    setMessages(historial);
    setInput("");
    setError(null);
    setIsSending(true);

    try {
      const respuesta = await chatService.enviarMensaje(historial, user?.usuarioId);

      setMessages([
        ...historial,
        { role: "asistente" as const, contenido: respuesta.mensaje },
      ]);
      setUltimaRespuesta(respuesta);
    } catch {
      setError("No pudimos obtener respuesta. Probá de nuevo.");
    } finally {
      setIsSending(false);
    }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    await enviar(input);
  }

  function handleToggleMode() {
    const nuevoModo = mode === "real" ? "mock" : "real";
    setChatMode(nuevoModo);
    setMode(nuevoModo);
    setMessages([]);
    setUltimaRespuesta(null);
    setError(null);
  }

  function handleVerResultados() {
    navigate(APP_ROUTES.resultados.root, {
      state: { viaje: ultimaRespuesta?.viaje ?? null },
    });
  }

  return (
    <div className="fv-theme-transition mx-auto flex min-h-screen w-full max-w-2xl flex-col p-3 sm:p-4">
      <header className="fv-theme-transition mb-4 border-b pb-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <Logo withWordmark size={30} variant={theme === "dark" ? "onDark" : "default"} />
            {mode === "mock" ? (
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800 dark:bg-amber-950 dark:text-amber-200">
                Modo demo
              </span>
            ) : (
              <span className="rounded-full bg-sky-100 px-2 py-0.5 text-xs font-semibold text-sky-800 dark:bg-sky-950 dark:text-sky-200">
                Modo real
              </span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <ThemeToggle />
            <Button variant="ghost" size="sm" onClick={handleToggleMode}>
              {mode === "real" ? "Probar modo demo" : "Volver a modo real"}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                logout();
                navigate(APP_ROUTES.auth.loginViajes, { replace: true });
              }}
            >
              Salir
            </Button>
          </div>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          {user ? `Hola, ${user.nombre}` : "Armá tu viaje charlando con la IA"}
        </p>
      </header>

      <div className="min-w-0 flex-1 space-y-3 overflow-y-auto py-2">
        {messages.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Contanos cuándo, con quién y con qué presupuesto querés viajar.
          </p>
        )}

        {messages.map((message, index) => (
          <MessageBubble key={index} role={message.role} content={message.contenido} />
        ))}

        <ThinkingIndicator active={isSending} theme={tripTheme} />

        {!isSending && ultimaRespuesta && ultimaRespuesta.preguntas.length > 0 && (
          <div className="mr-auto max-w-[85%] space-y-2 sm:max-w-[80%]">
            {ultimaRespuesta.preguntas.map((pregunta, index) => (
              <QuestionCard
                key={`${pregunta.campo}-${index}`}
                pregunta={pregunta}
                onResponder={enviar}
                camposFaltantesImportantes={ultimaRespuesta.camposFaltantesImportantes}
              />
            ))}
          </div>
        )}

        {!isSending && ultimaRespuesta && ultimaRespuesta.estado === "listoParaBuscar" && (
          <div className="fv-theme-transition mr-auto max-w-[85%] rounded-lg border bg-background p-3 sm:max-w-[80%]">
            <p className="text-sm font-medium">Encuesta completa</p>
            <SurveySummary viaje={ultimaRespuesta.viaje} />
            <p className="mt-3 mb-2 text-sm text-muted-foreground">
              Buscando las mejores opciones para vos... (próximamente — hoy la pantalla de resultados
              muestra datos de ejemplo, ver AUDITORIA_BACKEND.md)
            </p>
            <Button size="sm" className="h-11" onClick={handleVerResultados}>
              Ver resultados de ejemplo
            </Button>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {error && <p className="mb-2 text-sm text-destructive">{error}</p>}

      {conversacionCompleta && (
        <p className="mb-2 text-sm text-muted-foreground">
          Esta encuesta ya está completa. Volvé a "Ver resultados" o probá el modo demo para armar otro viaje.
        </p>
      )}

      <form onSubmit={handleSubmit} className="flex gap-2 border-t pt-3">
        <Input
          className="h-11 min-w-0 flex-1"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={conversacionCompleta ? "Encuesta completa" : "Escribí tu mensaje..."}
          disabled={isSending || conversacionCompleta}
        />
        <Button type="submit" className="h-11" disabled={isSending || conversacionCompleta || !input.trim()}>
          Enviar
        </Button>
      </form>
    </div>
  );
}
