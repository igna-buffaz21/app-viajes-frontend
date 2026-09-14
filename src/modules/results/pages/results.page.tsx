import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Info } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { APP_ROUTES } from "@/config/app.routes";
import type { ChatMessage, PerfilViaje } from "@/modules/chat/chat.types";
import { ThinkingIndicator } from "@/modules/chat/components/ThinkingIndicator";
import { detectResultadosTheme } from "@/modules/chat/tripThemeDetector";
import type { RetomarViajeState } from "@/modules/chat/reanudarViaje";

import { PropuestasView } from "../components/PropuestasView";
import { travelPlanService } from "../travelPlan.service";
import type { Propuesta } from "../results.types";

type Estado =
  | { tipo: "preparando" }
  | { tipo: "destinoAbierto" }
  | { tipo: "faltanDatos"; camposFaltantes: string[] }
  | { tipo: "buscando" }
  | { tipo: "servicioNoDisponible" }
  | { tipo: "error"; mensaje: string }
  | { tipo: "ok"; propuestas: Propuesta[]; warnings: string[] };

function Screen({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div
      role="status"
      className="fv-theme-transition flex flex-col items-center gap-3 rounded-lg border border-dashed p-8 text-center"
    >
      <p className="text-sm font-semibold">{title}</p>
      {children}
    </div>
  );
}

/**
 * A diferencia del link genérico del header (que solo navega a /chat), este
 * botón se usa en las pantallas donde lo que falta es corregir algo de la
 * encuesta (destino abierto, datos faltantes). Pasa el `viaje` ya juntado
 * vía router state para que ChatPage arranque una conversación NUEVA con
 * eso precargado en el input, en vez de reabrir la conversación vieja — que
 * MS1 va a rechazar con 409 porque ya la marcó "completo" (confirmado con
 * curl real).
 */
function VolverAlChatButton({ viaje, motivo }: { viaje: PerfilViaje | null; motivo: RetomarViajeState["motivo"] }) {
  const navigate = useNavigate();

  function handleClick() {
    const state: { retomarViaje?: RetomarViajeState } = viaje ? { retomarViaje: { viaje, motivo } } : {};
    navigate(APP_ROUTES.chat.root, { state });
  }

  return (
    <Button variant="outline" size="sm" onClick={handleClick}>
      Volver al chat
    </Button>
  );
}

export default function ResultsPage() {
  const location = useLocation();
  const navState = location.state as {
    viaje?: PerfilViaje | null;
    conversacionId?: string | null;
    messages?: ChatMessage[];
  } | null;
  const viaje = navState?.viaje ?? null;
  const conversacionId = navState?.conversacionId ?? null;
  // Respaldo de detectResultadosTheme cuando viaje.preferencias no trae
  // señal estructurada clara (ver tripThemeDetector.ts) — ausente si se
  // llega a /resultados por otro camino que no sea "Ver resultados" del
  // chat (ej. navegación directa a la URL).
  const tema = detectResultadosTheme(viaje, navState?.messages ?? []);

  const [estado, setEstado] = useState<Estado>({ tipo: "preparando" });

  // React.StrictMode (main.tsx) monta cada componente dos veces en
  // desarrollo, disparando este efecto dos veces — sin esta guarda, salían
  // dos búsquedas reales en paralelo. Mismo patrón que chat.page.tsx
  // (cargarConversacion).
  const runIdRef = useRef(0);

  async function prepararYBuscar() {
    const runId = ++runIdRef.current;
    const vigente = () => runIdRef.current === runId;

    setEstado({ tipo: "preparando" });

    if (!viaje || !conversacionId) {
      setEstado({ tipo: "faltanDatos", camposFaltantes: ["toda la encuesta"] });
      return;
    }

    // Pre-chequeo del lado del cliente: MS2 (POST /api/scraping-results)
    // rechaza sin destino igual, pero acá se evita el viaje de red y se da
    // un mensaje más claro. CONFIRMADO con curl real (2026-09-14):
    // viaje.destino.lugaresPreferidos es un array de STRINGS, no de objetos
    // {ciudad,pais} como espera scrapingResult.service.js de MS2 — por eso
    // siempre se manda `destinos` explícito más abajo, no se confía en que
    // MS2 lo derive solo de la conversación.
    const destinos = viaje.destino?.lugaresPreferidos?.filter((d) => d.trim()) ?? [];
    if (destinos.length === 0) {
      setEstado({ tipo: "destinoAbierto" });
      return;
    }

    setEstado({ tipo: "buscando" });

    const resultado = await travelPlanService.armarPropuestas({
      conversacionId,
      destinos,
      pasajeros: viaje.viajeros?.cantidadTotal,
    });
    if (!vigente()) return;

    if (resultado.estado === "ok") {
      setEstado({ tipo: "ok", propuestas: resultado.propuestas, warnings: resultado.warnings });
    } else if (resultado.estado === "servicioNoDisponible") {
      setEstado({ tipo: "servicioNoDisponible" });
    } else {
      setEstado({ tipo: "error", mensaje: resultado.mensaje });
    }
  }

  useEffect(() => {
    prepararYBuscar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="fv-theme-transition mx-auto w-full max-w-6xl space-y-6 p-3 sm:p-4">
      <header className="fv-theme-transition flex flex-wrap items-center justify-between gap-2 border-b pb-3">
        <h1 className="text-lg font-bold">Tu viaje</h1>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button variant="ghost" size="sm" asChild>
            <Link to={APP_ROUTES.chat.root}>Volver al chat</Link>
          </Button>
        </div>
      </header>

      {estado.tipo === "preparando" && (
        <p className="text-sm text-muted-foreground">Preparando tu búsqueda...</p>
      )}

      {estado.tipo === "destinoAbierto" && (
        <Screen title="Tu encuesta dejó el destino abierto">
          <p className="max-w-sm text-xs text-muted-foreground">
            Le diste a la IA libertad para elegir el destino, pero para armar propuestas reales
            necesitamos uno concreto — hoy todavía no tenemos un servicio que sugiera destinos
            automáticamente. Volvé al chat y contanos un destino puntual.
          </p>
          <VolverAlChatButton viaje={viaje} motivo="destinoAbierto" />
        </Screen>
      )}

      {estado.tipo === "faltanDatos" && (
        <Screen title="Todavía falta información para buscar">
          <p className="max-w-sm text-xs text-muted-foreground">
            Nos falta: {estado.camposFaltantes.join(", ")}. Volvé al chat para completar la
            encuesta.
          </p>
          <VolverAlChatButton viaje={viaje} motivo="faltanDatos" />
        </Screen>
      )}

      {estado.tipo === "buscando" && (
        <div className="fv-theme-transition flex flex-col items-center gap-2 rounded-2xl border border-border bg-card p-8 text-center">
          <ThinkingIndicator active theme={tema} />
          <p className="max-w-sm text-xs text-muted-foreground">
            Esto puede tardar un par de minutos — buscamos vuelos, hoteles y actividades reales, y
            después le pedimos a la IA que arme 3 propuestas completas con eso.
          </p>
        </div>
      )}

      {estado.tipo === "servicioNoDisponible" && (
        <Screen title="El servicio de búsqueda todavía no está disponible">
          <p className="max-w-sm text-xs text-muted-foreground">
            No pudimos conectar con el servicio que arma tu viaje. Puede que todavía no esté
            levantado — probá de nuevo en un rato.
          </p>
          <Button variant="outline" size="sm" onClick={prepararYBuscar}>
            Reintentar
          </Button>
        </Screen>
      )}

      {estado.tipo === "error" && (
        <Screen title="No pudimos armar tu viaje">
          <p className="max-w-sm text-xs text-muted-foreground">{estado.mensaje}</p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={prepararYBuscar}>
              Reintentar
            </Button>
            <VolverAlChatButton viaje={viaje} motivo="faltanDatos" />
          </div>
        </Screen>
      )}

      {estado.tipo === "ok" && (
        <>
          {estado.warnings.length > 0 && (
            <div className="fv-theme-transition flex gap-3 rounded-2xl border border-accent/30 bg-accent-soft p-4 text-sm text-foreground">
              <Info className="mt-0.5 size-4 flex-none text-accent" aria-hidden="true" />
              <div>
                <p className="font-medium">Algunas fuentes no respondieron</p>
                <ul className="mt-1 space-y-0.5 text-xs text-muted-foreground">
                  {estado.warnings.map((warning, i) => (
                    <li key={i}>{warning}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          <PropuestasView propuestas={estado.propuestas} />
        </>
      )}
    </div>
  );
}
