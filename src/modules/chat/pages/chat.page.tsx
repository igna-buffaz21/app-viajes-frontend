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
import { getConversacionActiva, limpiarConversacionActiva, setConversacionActiva } from "../chat.storage";
import { QuestionCard } from "../components/QuestionCard";
import { chatService } from "../chat.service";
import type { ChatMessage, ChatRespuesta, ConversacionResumen, EstadoConversacion, EstadoPerfil } from "../chat.types";
import { ConversationList } from "../components/ConversationList";
import { MessageBubble } from "../components/MessageBubble";
import { ThinkingIndicator } from "../components/ThinkingIndicator";
import { SurveySummary } from "../components/SurveySummary";
import { detectTripTheme } from "../tripThemeDetector";

/** Actualiza (o agrega) la entrada de una conversación en el listado de la sidebar sin tener que recargarlo del backend en cada mensaje. */
function actualizarListado(
  lista: ConversacionResumen[],
  conversacionId: string,
  primerMensaje: string,
  estadoPerfil: EstadoPerfil
): ConversacionResumen[] {
  const ahora = new Date().toISOString();
  const estadoConversacion: EstadoConversacion = estadoPerfil === "listoParaBuscar" ? "completo" : "en_progreso";
  const existente = lista.find((c) => c.conversacionId === conversacionId);

  const actualizada: ConversacionResumen = existente
    ? { ...existente, estado: estadoConversacion, updatedAt: ahora }
    : { conversacionId, estado: estadoConversacion, titulo: primerMensaje, createdAt: ahora, updatedAt: ahora };

  return [actualizada, ...lista.filter((c) => c.conversacionId !== conversacionId)];
}

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

  const [conversaciones, setConversaciones] = useState<ConversacionResumen[]>([]);
  const [conversacionActivaId, setConversacionActivaId] = useState<string | null>(null);
  const [cargandoConversaciones, setCargandoConversaciones] = useState(false);

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

  // Trae el listado de conversaciones del usuario y, si había una activa
  // guardada en localStorage (ver chat.storage.ts), la retoma automáticamente
  // en vez de dejar que el próximo mensaje resuma "cualquiera en progreso"
  // silenciosamente del lado del backend.
  useEffect(() => {
    if (mode !== "real" || !user?.usuarioId) {
      setConversaciones([]);
      return;
    }

    let cancelado = false;
    setCargandoConversaciones(true);

    chatService
      .listarConversaciones(user.usuarioId)
      .then((lista) => {
        if (cancelado) return;
        setConversaciones(lista);

        const idGuardado = getConversacionActiva(user.usuarioId);
        if (idGuardado && lista.some((c) => c.conversacionId === idGuardado)) {
          cargarConversacion(idGuardado);
        }
      })
      .finally(() => {
        if (!cancelado) setCargandoConversaciones(false);
      });

    return () => {
      cancelado = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, user?.usuarioId]);

  async function cargarConversacion(conversacionId: string) {
    setError(null);
    try {
      const detalle = await chatService.obtenerConversacion(conversacionId);
      if (!detalle) return;

      setMessages(detalle.mensajes);
      setConversacionActivaId(conversacionId);
      if (user?.usuarioId) setConversacionActiva(user.usuarioId, conversacionId);

      setUltimaRespuesta({
        mensaje: detalle.mensajes[detalle.mensajes.length - 1]?.contenido ?? "",
        // El detalle no trae las "preguntas" estructuradas del último turno
        // (no se persisten), así que al retomar una conversación en progreso
        // el usuario simplemente sigue escribiendo en el input de abajo.
        estado: detalle.estado === "completo" ? "listoParaBuscar" : "incompleto",
        viaje: detalle.viaje,
        preguntas: [],
        conversacionId,
      });
    } catch {
      setError("No pudimos cargar esa conversación. Probá de nuevo.");
    }
  }

  async function enviar(contenido: string) {
    if (!contenido.trim() || isSending || conversacionCompleta) return;

    const historial = [...messages, { role: "usuario" as const, contenido }];

    setMessages(historial);
    setInput("");
    setError(null);
    setIsSending(true);

    try {
      const respuesta = await chatService.enviarMensaje(
        historial,
        user?.usuarioId,
        conversacionActivaId ?? undefined,
        !conversacionActivaId
      );

      setMessages([
        ...historial,
        { role: "asistente" as const, contenido: respuesta.mensaje },
      ]);
      setUltimaRespuesta(respuesta);

      if (respuesta.conversacionId) {
        setConversacionActivaId(respuesta.conversacionId);
        if (user?.usuarioId) setConversacionActiva(user.usuarioId, respuesta.conversacionId);
        setConversaciones((prev) =>
          actualizarListado(prev, respuesta.conversacionId!, historial[0].contenido, respuesta.estado)
        );
      }
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

  function handleNuevaConversacion() {
    setMessages([]);
    setUltimaRespuesta(null);
    setConversacionActivaId(null);
    setError(null);
    if (user?.usuarioId) limpiarConversacionActiva(user.usuarioId);
  }

  function handleToggleMode() {
    const nuevoModo = mode === "real" ? "mock" : "real";
    setChatMode(nuevoModo);
    setMode(nuevoModo);
    setMessages([]);
    setUltimaRespuesta(null);
    setConversacionActivaId(null);
    setError(null);
  }

  function handleVerResultados() {
    navigate(APP_ROUTES.resultados.root, {
      state: { viaje: ultimaRespuesta?.viaje ?? null },
    });
  }

  return (
    <div className="fv-theme-transition mx-auto flex min-h-screen w-full max-w-5xl gap-4 p-3 sm:p-4">
      {mode === "real" && user && (
        <aside className="hidden w-64 flex-none sm:block">
          <ConversationList
            conversaciones={conversaciones}
            activaId={conversacionActivaId}
            onSeleccionar={cargarConversacion}
            onNueva={handleNuevaConversacion}
            cargando={cargandoConversaciones}
          />
        </aside>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
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
              Ya tenemos lo necesario para buscar vuelos, hoteles y actividades reales.
            </p>
            <Button size="sm" className="h-11" onClick={handleVerResultados}>
              Ver resultados
            </Button>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {error && <p className="mb-2 text-sm text-destructive">{error}</p>}

      {conversacionCompleta && (
        <p className="mb-2 text-sm text-muted-foreground">
          Esta encuesta ya está completa. Volvé a "Ver resultados" o arrancá una "Nueva conversación" para
          armar otro viaje.
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
    </div>
  );
}
