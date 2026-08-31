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

function truncar(texto: string, max = 48): string {
  return texto.length > max ? `${texto.slice(0, max).trimEnd()}…` : texto;
}

export function ConversationList({
  conversaciones,
  activaId,
  onSeleccionar,
  onNueva,
  cargando,
}: ConversationListProps) {
  return (
    <div className="fv-theme-transition flex h-full flex-col gap-2 rounded-lg border bg-background p-2">
      <Button type="button" size="sm" className="h-9 w-full" onClick={onNueva}>
        Nueva conversación
      </Button>

      <div className="min-h-0 flex-1 space-y-1 overflow-y-auto">
        {cargando && <p className="p-2 text-xs text-muted-foreground">Cargando conversaciones...</p>}

        {!cargando && conversaciones.length === 0 && (
          <p className="p-2 text-xs text-muted-foreground">Todavía no tenés conversaciones.</p>
        )}

        {conversaciones.map((conversacion) => {
          const activa = conversacion.conversacionId === activaId;
          return (
            <button
              key={conversacion.conversacionId}
              type="button"
              onClick={() => onSeleccionar(conversacion.conversacionId)}
              className={cn(
                "w-full rounded-md border px-2.5 py-2 text-left text-xs transition-colors hover:bg-muted",
                activa && "border-primary bg-primary/10"
              )}
            >
              <p className="truncate font-medium">{truncar(conversacion.titulo)}</p>
              <div className="mt-1 flex items-center justify-between text-[11px] text-muted-foreground">
                <span>{conversacion.estado === "en_progreso" ? "En progreso" : "Completa"}</span>
                <span>{FORMATO_FECHA.format(new Date(conversacion.updatedAt))}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
