import { MessageSquare, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import type { ConversacionResumen } from "../chat.types";

interface ConversationListProps {
  conversaciones: ConversacionResumen[];
  activaId: string | null;
  onSeleccionar: (conversacionId: string) => void;
  onNueva: () => void;
  cargando?: boolean;
}

const FORMATO_FECHA = new Intl.DateTimeFormat("es-AR", { day: "2-digit", month: "short" });

function truncar(texto: string, max = 52): string {
  return texto.length > max ? `${texto.slice(0, max).trimEnd()}…` : texto;
}

/** MS1 devuelve "Nueva conversación" como título por default antes de que haya un primer mensaje real — no es útil para identificar el chat en la lista, se prefiere el fallback de fecha + estado. */
function tituloUtil(conversacion: ConversacionResumen): string | null {
  const titulo = conversacion.titulo?.trim();
  if (!titulo || titulo.toLowerCase() === "nueva conversación") return null;
  return truncar(titulo);
}

export function ConversationList({
  conversaciones,
  activaId,
  onSeleccionar,
  onNueva,
  cargando,
}: ConversationListProps) {
  return (
    <div className="flex h-full flex-col gap-3">
      <Button type="button" size="lg" className="h-11 w-full gap-2" onClick={onNueva}>
        <Plus className="size-4" />
        Nueva conversación
      </Button>

      <div className="fv-scroll-thin min-h-0 flex-1 space-y-1 overflow-y-auto">
        {cargando && (
          <p className="px-2 py-3 text-xs text-muted-foreground">Cargando conversaciones…</p>
        )}

        {!cargando && conversaciones.length === 0 && (
          <p className="px-2 py-3 text-xs text-muted-foreground">
            Todavía no tenés conversaciones. Arrancá una nueva arriba.
          </p>
        )}

        {conversaciones.map((conversacion) => {
          const activa = conversacion.conversacionId === activaId;
          const titulo = tituloUtil(conversacion);
          const estadoLabel = conversacion.estado === "en_progreso" ? "En progreso" : "Completa";
          const fecha = FORMATO_FECHA.format(new Date(conversacion.updatedAt));

          return (
            <button
              key={conversacion.conversacionId}
              type="button"
              onClick={() => onSeleccionar(conversacion.conversacionId)}
              aria-current={activa ? "true" : undefined}
              className={cn(
                "fv-theme-transition group/item relative flex w-full items-start gap-2.5 rounded-xl px-2.5 py-2.5 text-left transition-colors",
                activa ? "bg-primary-soft" : "hover:bg-muted"
              )}
            >
              <span
                className={cn(
                  "fv-theme-transition mt-0.5 inline-flex size-7 flex-none items-center justify-center rounded-full",
                  activa
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground group-hover/item:text-foreground"
                )}
              >
                <MessageSquare className="size-3.5" />
              </span>

              <span className="min-w-0 flex-1">
                <span
                  className={cn(
                    "block truncate text-sm font-medium",
                    activa ? "text-primary" : "text-foreground"
                  )}
                >
                  {titulo ?? `Conversación ${conversacion.estado === "en_progreso" ? "sin empezar" : "completa"}`}
                </span>
                <span className="mt-0.5 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                  <span>{estadoLabel}</span>
                  <span aria-hidden>·</span>
                  <span>{fecha}</span>
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
