import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

import { resolverOpciones } from "../chat.options";
import type { PreguntaPerfil } from "../chat.types";
import { SiNoQuestion } from "./SiNoQuestion";

interface QuestionCardProps {
  pregunta: PreguntaPerfil;
  onResponder: (texto: string) => void;
  camposFaltantesImportantes?: string[];
}

export function QuestionCard({ pregunta, onResponder, camposFaltantesImportantes }: QuestionCardProps) {
  // La config local (chips curados por campo, con fallback por
  // camposFaltantesImportantes cuando la IA manda un `campo` sin el path
  // completo) tiene prioridad porque sabe si el campo admite selección
  // múltiple (ej. clima/intereses); si no hay config local, se usan las
  // `opciones` que mandó la IA para tipoPregunta "opciones" (siempre
  // selección única, ver promtIA.model.ts en backend).
  const configLocal = resolverOpciones(pregunta.campo, camposFaltantesImportantes);
  const opcionesBackend =
    pregunta.tipoPregunta === "opciones" && pregunta.opciones?.length ? pregunta.opciones : undefined;
  const config = configLocal ?? (opcionesBackend ? { opciones: opcionesBackend, multiple: false } : undefined);
  const esSiNo = pregunta.tipoPregunta === "siNo";
  const otroPanelId = `otro-panel-${pregunta.campo}`;

  const [seleccionadas, setSeleccionadas] = useState<Set<string>>(new Set());
  const [otroActivo, setOtroActivo] = useState(false);
  const [otroTexto, setOtroTexto] = useState("");

  function toggleSeleccion(opcion: string) {
    setSeleccionadas((prev) => {
      const next = new Set(prev);
      if (next.has(opcion)) next.delete(opcion);
      else next.add(opcion);
      return next;
    });
  }

  function confirmarMultiple() {
    const otro = otroTexto.trim();
    const valores = [...seleccionadas, ...(otro ? [otro] : [])];
    if (valores.length === 0) return;
    onResponder(valores.join(", "));
  }

  function enviarOtroUnico() {
    const otro = otroTexto.trim();
    if (!otro) return;
    onResponder(otro);
  }

  function handleOtroKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key !== "Enter") return;
    e.preventDefault();
    if (config?.multiple) {
      confirmarMultiple();
    } else {
      enviarOtroUnico();
    }
  }

  // Sin nada clickeable (tipoPregunta "texto" sin chips curados), la tarjeta
  // solo repetiría el texto de la pregunta que ya se ve en el mensaje del
  // asistente arriba — mejor no mostrarla y que el usuario responda en el
  // input principal del chat.
  if (!esSiNo && !config) return null;

  return (
    <div className="fv-theme-transition rounded-lg border bg-background p-2">
      <p className="text-sm">{pregunta.pregunta}</p>

      {esSiNo && <SiNoQuestion onResponder={onResponder} />}

      {!esSiNo && config && (
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          {config.opciones.map((opcion) => {
            const activa = seleccionadas.has(opcion);
            return (
              <button
                key={opcion}
                type="button"
                aria-pressed={config.multiple ? activa : undefined}
                onClick={() => (config.multiple ? toggleSeleccion(opcion) : onResponder(opcion))}
                className={cn(
                  "rounded-full border px-2.5 py-1 text-xs transition-colors hover:bg-muted",
                  activa && "border-primary bg-primary text-primary-foreground hover:bg-primary"
                )}
              >
                {opcion}
              </button>
            );
          })}

          <button
            type="button"
            aria-expanded={otroActivo}
            aria-controls={otroPanelId}
            onClick={() => {
              setOtroActivo((prev) => {
                const next = !prev;
                if (!next) setOtroTexto("");
                return next;
              });
            }}
            className={cn(
              "rounded-full border px-2.5 py-1 text-xs transition-colors hover:bg-muted",
              otroActivo && "border-primary bg-primary text-primary-foreground hover:bg-primary"
            )}
          >
            Otro
          </button>

          {config.multiple && (
            <Button
              type="button"
              size="sm"
              className="h-7 rounded-full px-3 text-xs"
              disabled={seleccionadas.size === 0 && !otroTexto.trim()}
              onClick={confirmarMultiple}
            >
              Confirmar
            </Button>
          )}
        </div>
      )}

      {config && otroActivo && (
        <div id={otroPanelId} className="mt-2 flex gap-1.5">
          <Input
            className="h-8 min-w-0 flex-1 text-xs"
            value={otroTexto}
            onChange={(e) => setOtroTexto(e.target.value)}
            onKeyDown={handleOtroKeyDown}
            placeholder="Escribí tu respuesta..."
            aria-label="Otra respuesta"
          />
          {!config.multiple && (
            <Button type="button" size="sm" className="h-8 px-3 text-xs" onClick={enviarOtroUnico}>
              Enviar
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
