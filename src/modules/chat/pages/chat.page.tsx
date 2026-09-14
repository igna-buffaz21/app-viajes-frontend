import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { Menu } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Logo } from "@/components/brand/Logo";
import { APP_ROUTES } from "@/config/app.routes";
import { prefersReducedMotion } from "@/lib/motion";
import { useTheme } from "@/lib/useTheme";
import { useIsDesktop } from "@/lib/useIsDesktop";
import { useAppAuth } from "@/modules/session/useAppAuth";

import {
  getConversacionActiva,
  getHistorialDesktopAbierto,
  limpiarConversacionActiva,
  setConversacionActiva,
  setHistorialDesktopAbierto,
} from "../chat.storage";
import { AccountFooter } from "../components/AccountFooter";
import { ChatInputArea } from "../components/ChatInputArea";
import { QuestionCard } from "../components/QuestionCard";
import { chatService } from "../chat.service";
import type { ChatMessage, ChatRespuesta, ConversacionResumen, EstadoConversacion, EstadoPerfil } from "../chat.types";
import { ConversationList } from "../components/ConversationList";
import { MessageBubble } from "../components/MessageBubble";
import { ThinkingIndicator } from "../components/ThinkingIndicator";
import { SurveySummary } from "../components/SurveySummary";
import { detectTripTheme } from "../tripThemeDetector";
import { construirResumenViaje, PEDIDO_DESTINO_CONCRETO, type RetomarViajeState } from "../reanudarViaje";

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
  const location = useLocation();
  const { user, logout } = useAppAuth();
  const { theme } = useTheme();

  // Viene de /resultados (ver results.page.tsx → VolverAlChatButton) cuando
  // hace falta corregir algo de la encuesta (destino abierto, datos
  // faltantes, destino no encontrado en MS2) sobre una conversación que MS1
  // ya marcó "completo" — esa conversación rechaza con 409 cualquier
  // mensaje nuevo (confirmado con curl real), así que la única opción es
  // arrancar una conversación nueva. Se lee una sola vez al montar (un
  // useRef, no depende de location.state en renders posteriores) para no
  // reaplicarlo si el usuario navega de vuelta a /chat por otro lado.
  const retomarViajeRef = useRef(
    (location.state as { retomarViaje?: RetomarViajeState } | null)?.retomarViaje ?? null
  );

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [ultimaRespuesta, setUltimaRespuesta] = useState<ChatRespuesta | null>(null);
  const [input, setInput] = useState(() =>
    retomarViajeRef.current
      ? `${construirResumenViaje(retomarViajeRef.current.viaje)} ${
          retomarViajeRef.current.motivo === "destinoAbierto" ? PEDIDO_DESTINO_CONCRETO : ""
        }`.trim() + " "
      : ""
  );
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [conversaciones, setConversaciones] = useState<ConversacionResumen[]>([]);
  const [conversacionActivaId, setConversacionActivaId] = useState<string | null>(null);
  const [cargandoConversaciones, setCargandoConversaciones] = useState(false);

  // Abajo de md (ver useIsDesktop.ts): el historial es un drawer/overlay que
  // tapa el contenido, arranca cerrado siempre, no se persiste. Desde md: es
  // un panel fijo que empuja el chat, y recuerda si estaba abierto/cerrado
  // por usuario (ver chat.storage.ts) — mismo criterio que el historial de
  // esta interfaz de Claude.
  const isDesktop = useIsDesktop();
  const [mobileAbierto, setMobileAbierto] = useState(false);
  const [desktopAbierto, setDesktopAbierto] = useState(getHistorialDesktopAbierto);
  const historialAbierto = isDesktop ? desktopAbierto : mobileAbierto;

  function toggleHistorial() {
    if (isDesktop) {
      setDesktopAbierto((prev) => {
        const next = !prev;
        setHistorialDesktopAbierto(next);
        return next;
      });
    } else {
      setMobileAbierto((prev) => !prev);
    }
  }

  /** Cierra el historial solo en mobile (drawer) — en desktop, al ser un panel persistente, elegir una conversación o arrancar una nueva no lo cierra (mismo criterio que el historial de Claude). */
  function cerrarHistorialEnMobile() {
    if (!isDesktop) setMobileAbierto(false);
  }

  const bottomRef = useRef<HTMLDivElement>(null);
  const retomarViajeLimpiadoRef = useRef(false);

  // Limpia la conversación activa guardada y el state de navegación en
  // cuanto sabemos el usuarioId real (puede tardar: en modo "clerk" depende
  // de que resuelva el puente Mongo, ver useAppAuth) — así el efecto de
  // abajo (retomar la última conversación guardada) nunca llega a pisar el
  // input precargado. `retomarViajeLimpiadoRef` evita repetir el navigate()
  // en cada render mientras usuarioId sigue sin resolver.
  useEffect(() => {
    if (!retomarViajeRef.current || retomarViajeLimpiadoRef.current || !user?.usuarioId) return;
    retomarViajeLimpiadoRef.current = true;
    limpiarConversacionActiva(user.usuarioId);
    navigate(APP_ROUTES.chat.root, { replace: true, state: null });
  }, [user?.usuarioId, navigate]);

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
    if (!user?.usuarioId) {
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
  }, [user?.usuarioId]);

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
    cerrarHistorialEnMobile();
  }

  async function handleSeleccionarConversacion(conversacionId: string) {
    await cargarConversacion(conversacionId);
    cerrarHistorialEnMobile();
  }

  function handleLogout() {
    logout();
    navigate(APP_ROUTES.auth.loginViajes, { replace: true });
  }

  function handleVerResultados() {
    navigate(APP_ROUTES.resultados.root, {
      // `messages` viaja también: es el respaldo de detectResultadosTheme
      // (ver tripThemeDetector.ts) para cuando viaje.preferencias no trae
      // señal estructurada clara — sin esto, /resultados nunca podría usar
      // el fallback de texto libre.
      //
      // `conversacionId` es nuevo (2026-09-14): el flujo real de
      // /resultados pasó a ser POST /api/scraping-results {conversacionId}
      // → POST /api/travels — necesita la conversación de MS1, no solo el
      // `viaje` ya resuelto (ver travelPlan.service.ts).
      state: {
        viaje: ultimaRespuesta?.viaje ?? null,
        conversacionId: ultimaRespuesta?.conversacionId ?? null,
        messages,
      },
    });
  }

  return (
    <div className="flex min-h-screen w-full">
      {/* Desktop (md:+): panel fijo que empuja el contenido — nunca tapa
          nada. El ancho anima entre 0 y 18rem (w-72) con overflow-hidden en
          el contenedor externo; el interno queda fijo en w-72 para que el
          contenido no se aplaste durante la transición, solo se recorte. */}
      {isDesktop && user && (
        <aside
          className={`fv-theme-transition hidden shrink-0 overflow-hidden transition-[width] duration-300 ease-in-out md:block ${
            desktopAbierto ? "w-72 border-r border-border" : "w-0"
          }`}
        >
          <div className="flex h-full w-72 flex-col gap-1 p-3">
            <p className="px-1 pb-1 text-sm font-semibold text-foreground">Tus conversaciones</p>
            <div className="min-h-0 flex-1">
              <ConversationList
                conversaciones={conversaciones}
                activaId={conversacionActivaId}
                onSeleccionar={handleSeleccionarConversacion}
                onNueva={handleNuevaConversacion}
                cargando={cargandoConversaciones}
              />
            </div>
            <AccountFooter nombre={user.nombre} onLogout={handleLogout} />
          </div>
        </aside>
      )}

      {/* Mobile: mismo Sheet/drawer de siempre, sin cambios de comportamiento — controlado por `mobileAbierto`, nunca se abre en desktop. */}
      {user && (
        <Sheet open={mobileAbierto} onOpenChange={setMobileAbierto}>
          <SheetContent side="left" className="p-0">
            <SheetHeader>
              <SheetTitle>Tus conversaciones</SheetTitle>
            </SheetHeader>
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden p-3">
              <div className="min-h-0 flex-1 overflow-hidden">
                <ConversationList
                  conversaciones={conversaciones}
                  activaId={conversacionActivaId}
                  onSeleccionar={handleSeleccionarConversacion}
                  onNueva={handleNuevaConversacion}
                  cargando={cargandoConversaciones}
                />
              </div>
              <AccountFooter nombre={user.nombre} onLogout={handleLogout} />
            </div>
          </SheetContent>
        </Sheet>
      )}

    <div className="fv-theme-transition mx-auto flex min-h-screen w-full max-w-3xl flex-1 flex-col p-3 sm:p-4">
      <div className="flex min-w-0 flex-1 flex-col">
      <header className="fv-theme-transition mb-4 flex items-center gap-2 border-b pb-3">
        {user && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Ver historial de conversaciones"
            aria-expanded={historialAbierto}
            onClick={toggleHistorial}
          >
            <Menu className="size-4" />
          </Button>
        )}
        <Logo withWordmark size={30} variant={theme === "dark" ? "onDark" : "default"} />
      </header>

      <div className="fv-scroll-thin min-w-0 flex-1 space-y-3 overflow-y-auto py-2">
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

      <form onSubmit={handleSubmit} className="border-t pt-3">
        <ChatInputArea
          value={input}
          onChange={setInput}
          onEnviar={() => enviar(input)}
          placeholder={conversacionCompleta ? "Encuesta completa" : "Escribí tu mensaje..."}
          disabled={isSending || conversacionCompleta}
        />
      </form>
      </div>
    </div>
    </div>
  );
}
