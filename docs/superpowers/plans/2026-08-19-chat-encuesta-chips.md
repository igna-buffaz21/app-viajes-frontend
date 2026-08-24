# Chat: encuesta con chips + desconexión de "propuesta final" — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Alinear el chat de FreeVago con el alcance real de MS1 (solo conversar y completar el perfil de viaje — nunca recomendar destinos ni armar itinerario): desconectar la detección heurística de "propuesta final" del flujo de chat, y reemplazar el input de texto libre puro por una encuesta con chips de respuesta rápida (selección única, selección múltiple, y "Otro" con texto libre) para los campos que tienen valores permitidos conocidos.

**Architecture:** Cuatro cambios independientes sobre el módulo `src/modules/chat/`, ejecutados en secuencia porque los cuatro tocan `chat.page.tsx` en regiones distintas y no solapadas: (1) datos de opciones por campo + componente `QuestionCard` para chips single/multi-select con fallback "Otro"; (2) `MessageBubble` deja de detectar/renderizar "propuesta final", `messageParser.ts`/`ProposalCard.tsx` quedan en el repo pero sin consumidores; (3) componente `SurveySummary` para el estado `listoParaBuscar`, sin inventar ninguna propuesta; (4) badge de advertencia en modo "real" + nota de coordinación para el equipo de backend.

**Tech Stack:** React 19 + TypeScript, Tailwind v4 (tokens ya wireados para light/dark), componentes shadcn/ui existentes (`Button`, `Input`).

**Spec:** Corrección de alcance verbal del usuario (2026-08-19, "confirmada por el equipo completo") — no hay archivo de spec separado; este plan es la única fuente escrita. Contexto de dominio: `GLOSARIO_DOMINIO.md` (cadena MS1→MS2→MS3), `AUDITORIA_BACKEND.md` §2 y §9bis (gap del contrato de chat progresivo, bug del system prompt muerto en `promtIA.model.ts`), `NOTAS_PARA_EL_EQUIPO.md`.

## Global Constraints

- MS1 (nuestro alcance) solo conversa y completa el perfil de viaje (`estado: "incompleto" | "listoParaBuscar"`); nunca recomienda destinos ni arma itinerario — eso es de MS2/MS3, que no existen todavía.
- No tocar código de `MicroServicioGrupo2` (fuera de este repo, solo lectura).
- No borrar `messageParser.ts` ni `ProposalCard.tsx` — desconectar del flujo de chat, dejarlos en el código para la futura pantalla de resultados reales.
- El renderizado de markdown existente (`MarkdownMessage`) se mantiene sin cambios para cualquier texto que devuelva la IA.
- No hay test runner configurado en este proyecto (ver `package.json` — solo `tsc -b && vite build`). Verificar cada task con `npm run build` (debe terminar limpio, sin errores de tipos).
- Sin commits de tu parte en ninguna task: implementar, `git add -A` para dejar el working tree organizado, y entregar así a revisión. El commit lo hace el usuario manualmente, task por task.

---

## Task 1: Encuesta con chips (single-select, multi-select, "Otro")

**Files:**
- Modify: `src/modules/chat/chat.options.ts`
- Create: `src/modules/chat/components/QuestionCard.tsx`
- Modify: `src/modules/chat/pages/chat.page.tsx`

**Interfaces:**
- Consumes: `PreguntaPerfil` (`src/modules/chat/chat.types.ts:8-12`, ya existe: `{ campo: string; pregunta: string; motivo: string }`).
- Produces: `OpcionesCampo` (`{ opciones: string[]; multiple: boolean }`) y `OPCIONES_POR_CAMPO: Record<string, OpcionesCampo>` desde `chat.options.ts`; componente `QuestionCard({ pregunta: PreguntaPerfil; onResponder: (texto: string) => void })` desde `components/QuestionCard.tsx`. Ambos son usados solo por `chat.page.tsx` en este plan.

- [ ] **Step 1: Reescribir `chat.options.ts` con el nuevo shape (agrega `multiple` y los campos sugeridos abiertos)**

Reemplazar todo el archivo:

```ts
// Valores permitidos por campo (contrato B del encargo) — se usan para
// ofrecer chips de respuesta rápida en vez de dejar solo texto libre.
// `multiple: true` son campos array (selección múltiple + botón de
// confirmar); `multiple: false` son campos de valor único (click = envío
// inmediato). Los campos sin entrada acá quedan como texto libre puro.
export interface OpcionesCampo {
  opciones: string[];
  multiple: boolean;
}

export const OPCIONES_POR_CAMPO: Record<string, OpcionesCampo> = {
  "preferencias.ritmoViaje": { opciones: ["tranquilo", "equilibrado", "intenso"], multiple: false },
  "preferencias.vidaNocturna": { opciones: ["nada", "poca", "bastante", "prioridad"], multiple: false },
  "preferencias.naturaleza": { opciones: ["nada", "poca", "bastante", "prioridad"], multiple: false },
  "preferencias.gastronomia": { opciones: ["nada", "poca", "bastante", "prioridad"], multiple: false },
  "preferencias.cultura": { opciones: ["nada", "poca", "bastante", "prioridad"], multiple: false },
  "preferencias.socializar": { opciones: ["noImporta", "meGustaria", "prioridad"], multiple: false },
  "transporte.vuelo.clase": { opciones: ["economica", "premiumEconomy", "business", "primeraClase"], multiple: false },
  "transporte.vuelo.escalas": { opciones: ["sinEscalas", "maxUna", "indiferente"], multiple: false },
  "viajeros.personas[].tipo": { opciones: ["adulto", "menor", "bebe"], multiple: false },
  "preferencias.tipoViaje": {
    opciones: ["relax", "playa", "aventura", "cultural", "gastronomico", "naturaleza"],
    multiple: true,
  },
  "preferencias.intereses": {
    opciones: ["playa", "montaña", "naturaleza", "cultura", "gastronomia", "vida nocturna"],
    multiple: true,
  },
  "preferencias.clima": { opciones: ["calido", "templado", "frio"], multiple: true },
};
```

- [ ] **Step 2: Crear `src/modules/chat/components/QuestionCard.tsx`**

```tsx
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

import { OPCIONES_POR_CAMPO } from "../chat.options";
import type { PreguntaPerfil } from "../chat.types";

interface QuestionCardProps {
  pregunta: PreguntaPerfil;
  onResponder: (texto: string) => void;
}

export function QuestionCard({ pregunta, onResponder }: QuestionCardProps) {
  const config = OPCIONES_POR_CAMPO[pregunta.campo];

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

  return (
    <div className="fv-theme-transition rounded-lg border bg-background p-2">
      <p className="text-sm">{pregunta.pregunta}</p>

      {config && (
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          {config.opciones.map((opcion) => {
            const activa = seleccionadas.has(opcion);
            return (
              <button
                key={opcion}
                type="button"
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
            onClick={() => setOtroActivo((prev) => !prev)}
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
        <div className="mt-2 flex gap-1.5">
          <Input
            className="h-8 min-w-0 flex-1 text-xs"
            value={otroTexto}
            onChange={(e) => setOtroTexto(e.target.value)}
            placeholder="Escribí tu respuesta..."
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
```

- [ ] **Step 3: Wirear `QuestionCard` en `chat.page.tsx`**

Reemplazar el import de la línea 14:

```tsx
import { OPCIONES_POR_CAMPO } from "../chat.options";
```

por:

```tsx
import { QuestionCard } from "../components/QuestionCard";
```

Reemplazar el bloque de preguntas (líneas 138-164 del archivo actual):

```tsx
        {!isSending && ultimaRespuesta && ultimaRespuesta.preguntas.length > 0 && (
          <div className="mr-auto max-w-[85%] space-y-2 sm:max-w-[80%]">
            {ultimaRespuesta.preguntas.map((pregunta) => {
              const opciones = OPCIONES_POR_CAMPO[pregunta.campo];

              return (
                <div key={pregunta.campo} className="fv-theme-transition rounded-lg border bg-background p-2">
                  <p className="text-sm">{pregunta.pregunta}</p>
                  {opciones && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {opciones.map((opcion) => (
                        <button
                          key={opcion}
                          type="button"
                          onClick={() => enviar(opcion)}
                          className="rounded-full border px-2.5 py-1 text-xs hover:bg-muted"
                        >
                          {opcion}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
```

por:

```tsx
        {!isSending && ultimaRespuesta && ultimaRespuesta.preguntas.length > 0 && (
          <div className="mr-auto max-w-[85%] space-y-2 sm:max-w-[80%]">
            {ultimaRespuesta.preguntas.map((pregunta) => (
              <QuestionCard key={pregunta.campo} pregunta={pregunta} onResponder={enviar} />
            ))}
          </div>
        )}
```

- [ ] **Step 4: Verificar build**

Run: `npm run build` (en `C:/Proyectos/app-viajes-frontend/.worktrees/chat-estetica`)
Expected: termina limpio, sin errores de TypeScript.

- [ ] **Step 5: Stage**

```bash
git add -A
```

---

## Task 2: Desconectar "propuesta final" del flujo de chat

**Files:**
- Modify: `src/modules/chat/components/MessageBubble.tsx`
- Modify: `src/modules/chat/pages/chat.page.tsx`
- Modify: `src/modules/chat/messageParser.ts` (solo comentario)
- Modify: `src/modules/chat/components/ProposalCard.tsx` (solo comentario)

**Interfaces:**
- Consumes: `ChatRole`, `MarkdownMessage` (ya existentes, sin cambios de firma).
- Produces: `MessageBubble({ role: ChatRole; content: string })` — pierde el prop `onElegirPropuesta`, que ya no tiene ningún consumidor real.

- [ ] **Step 1: Simplificar `MessageBubble.tsx`**

Reemplazar todo el archivo:

```tsx
import type { ChatRole } from "../chat.types";
import { MarkdownMessage } from "./MarkdownMessage";

interface MessageBubbleProps {
  role: ChatRole;
  content: string;
}

export function MessageBubble({ role, content }: MessageBubbleProps) {
  if (role === "usuario") {
    return (
      <div className="fv-msg-in fv-theme-transition ml-auto max-w-[85%] rounded-lg bg-primary px-3 py-2 text-sm break-words text-primary-foreground sm:max-w-[80%]">
        {content}
      </div>
    );
  }

  return (
    <div className="fv-msg-in fv-theme-transition mr-auto max-w-[85%] break-words rounded-lg border border-border bg-card px-3 py-2 sm:max-w-[80%]">
      <MarkdownMessage content={content} />
    </div>
  );
}
```

- [ ] **Step 2: Quitar el prop `onElegirPropuesta` del call site en `chat.page.tsx`**

Reemplazar:

```tsx
        {messages.map((message, index) => (
          <MessageBubble
            key={index}
            role={message.role}
            content={message.contenido}
            onElegirPropuesta={() => enviar("Quiero elegir esta propuesta.")}
          />
        ))}
```

por:

```tsx
        {messages.map((message, index) => (
          <MessageBubble key={index} role={message.role} content={message.contenido} />
        ))}
```

- [ ] **Step 3: Anotar la desconexión en `messageParser.ts`**

Reemplazar el comentario de cabecera (líneas 2-10):

```ts
/**
 * Heurística FRÁGIL para detectar y extraer la "propuesta final" de viaje a
 * partir del markdown en texto libre que devuelve MS1 (Gemini). MS1 no
 * expone un contrato estructurado para esto — solo prosa con formato
 * reconocible (tabla de presupuesto + días "Día N"). Si el día de mañana
 * MS1 empieza a devolver JSON real, este archivo es el que se reemplaza o
 * se elimina: el resto del chat solo depende de `isFinalProposal` y
 * `parseFinalProposal`, nunca de los detalles internos de acá.
 */
```

por:

```ts
/**
 * Heurística FRÁGIL para detectar y extraer la "propuesta final" de viaje a
 * partir del markdown en texto libre que devuelve MS1 (Gemini). MS1 no
 * expone un contrato estructurado para esto — solo prosa con formato
 * reconocible (tabla de presupuesto + días "Día N"). Si el día de mañana
 * MS1 empieza a devolver JSON real, este archivo es el que se reemplaza o
 * se elimina: el resto del chat solo depende de `isFinalProposal` y
 * `parseFinalProposal`, nunca de los detalles internos de acá.
 *
 * DESCONECTADO del flujo de chat (corrección de alcance 2026-08-19): MS1
 * solo debe conversar y frenar en "listoParaBuscar", nunca recomendar
 * destinos ni armar un itinerario — eso es de MS2/MS3. Nada en
 * `MessageBubble` llama a este archivo hoy. Queda vivo para la futura
 * pantalla de resultados reales, cuando MS3 exista y produzca una
 * `propuesta` (ver GLOSARIO_DOMINIO.md) con forma similar a esta.
 */
```

- [ ] **Step 4: Anotar la desconexión en `ProposalCard.tsx`**

Agregar como primera línea del archivo (antes de `import { useState } from "react";`):

```tsx
// Desconectado del flujo de chat (corrección de alcance 2026-08-19): MS1 no
// debe producir "propuestas finales", eso es de MS2/MS3. Nada importa este
// componente hoy — queda para la futura pantalla de resultados reales.
```

- [ ] **Step 5: Verificar build**

Run: `npm run build`
Expected: termina limpio. Confirmar además (lectura, no test automatizado) que no quedó ningún import roto de `isFinalProposal`/`parseFinalProposal`/`ProposalCard` fuera de sus propios archivos: `grep -rn "isFinalProposal\|parseFinalProposal\|ProposalCard" src/ --include=*.tsx --include=*.ts` no debe listar `MessageBubble.tsx` ni `chat.page.tsx`.

- [ ] **Step 6: Stage**

```bash
git add -A
```

---

## Task 3: Estado visual de "encuesta completa" (sin inventar propuestas)

**Files:**
- Create: `src/modules/chat/components/SurveySummary.tsx`
- Modify: `src/modules/chat/pages/chat.page.tsx`

**Interfaces:**
- Consumes: `PerfilViaje` (`src/modules/chat/chat.types.ts:20-64`, ya existe).
- Produces: `SurveySummary({ viaje: PerfilViaje | null })` — usado solo por `chat.page.tsx` en este plan.

- [ ] **Step 1: Crear `src/modules/chat/components/SurveySummary.tsx`**

```tsx
import type { PerfilViaje } from "../chat.types";

interface SurveySummaryProps {
  viaje: PerfilViaje | null;
}

function formatDestino(viaje: PerfilViaje): string {
  const preferido = viaje.destino?.lugaresPreferidos?.[0];
  if (preferido) {
    return [preferido.ciudad, preferido.pais].filter(Boolean).join(", ");
  }
  return "Destino abierto";
}

function formatFechas(viaje: PerfilViaje): string | null {
  if (viaje.fechaSalida) {
    return viaje.fechaFin ? `${viaje.fechaSalida} – ${viaje.fechaFin}` : viaje.fechaSalida;
  }
  const dias = viaje.informacionTemporal?.duracionDiasAproximada;
  return dias ? `${dias} días aprox.` : null;
}

function formatPresupuesto(viaje: PerfilViaje): string | null {
  if (!viaje.presupuesto?.monto) return null;
  const moneda = viaje.presupuesto.moneda ?? "";
  return `${moneda} ${viaje.presupuesto.monto.toLocaleString("es-AR")}`.trim();
}

function formatViajeros(viaje: PerfilViaje): string | null {
  return viaje.viajeros?.cantidadTotal ? `${viaje.viajeros.cantidadTotal} viajero(s)` : null;
}

export function SurveySummary({ viaje }: SurveySummaryProps) {
  if (!viaje) return null;

  const filas = [
    { label: "Destino", value: formatDestino(viaje) },
    { label: "Fechas", value: formatFechas(viaje) },
    { label: "Presupuesto", value: formatPresupuesto(viaje) },
    { label: "Viajeros", value: formatViajeros(viaje) },
  ].filter((fila): fila is { label: string; value: string } => Boolean(fila.value));

  if (filas.length === 0) return null;

  return (
    <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs">
      {filas.map((fila) => (
        <div key={fila.label} className="contents">
          <dt className="text-muted-foreground">{fila.label}</dt>
          <dd className="text-right font-medium">{fila.value}</dd>
        </div>
      ))}
    </dl>
  );
}
```

- [ ] **Step 2: Wirear en `chat.page.tsx`**

Agregar el import (junto a los demás imports de `../components/`):

```tsx
import { SurveySummary } from "../components/SurveySummary";
```

Reemplazar el bloque de `listoParaBuscar`:

```tsx
        {!isSending && ultimaRespuesta?.estado === "listoParaBuscar" && (
          <div className="fv-theme-transition mr-auto max-w-[85%] rounded-lg border bg-background p-3 sm:max-w-[80%]">
            <p className="mb-2 text-sm">Ya tenemos lo necesario para buscar tu viaje.</p>
            <Button size="sm" className="h-11" onClick={handleVerResultados}>
              Ver resultados
            </Button>
          </div>
        )}
```

por (nota: la condición cambia de `ultimaRespuesta?.estado === ...` a `ultimaRespuesta && ultimaRespuesta.estado === ...` — el optional-chaining original no angosta el tipo de `ultimaRespuesta` para el acceso a `.viaje` que sigue, y `npm run build` fallaría con "Object is possibly 'null'" si se deja como estaba):

```tsx
        {!isSending && ultimaRespuesta && ultimaRespuesta.estado === "listoParaBuscar" && (
          <div className="fv-theme-transition mr-auto max-w-[85%] rounded-lg border bg-background p-3 sm:max-w-[80%]">
            <p className="text-sm font-medium">Encuesta completa</p>
            <SurveySummary viaje={ultimaRespuesta.viaje} />
            <p className="mt-3 mb-2 text-sm text-muted-foreground">
              Buscando las mejores opciones para vos... (próximamente — hoy esta pantalla muestra datos de
              ejemplo, ver AUDITORIA_BACKEND.md)
            </p>
            <Button size="sm" className="h-11" onClick={handleVerResultados}>
              Ver resultados de ejemplo
            </Button>
          </div>
        )}
```

- [ ] **Step 3: Verificar build**

Run: `npm run build`
Expected: termina limpio.

- [ ] **Step 4: Stage**

```bash
git add -A
```

---

## Task 4: Claridad de modo (real vs. demo) + nota de coordinación

**Files:**
- Modify: `src/modules/chat/pages/chat.page.tsx`
- Modify: `NOTAS_PARA_EL_EQUIPO.md`

**Interfaces:**
- Sin interfaces nuevas — solo JSX/copy en `chat.page.tsx` y una sección nueva al final de `NOTAS_PARA_EL_EQUIPO.md`.

- [ ] **Step 1: Badge de advertencia para modo "real" en `chat.page.tsx`**

Reemplazar:

```tsx
            {mode === "mock" && (
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800 dark:bg-amber-950 dark:text-amber-200">
                Modo demo
              </span>
            )}
```

por:

```tsx
            {mode === "mock" ? (
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800 dark:bg-amber-950 dark:text-amber-200">
                Modo demo (recomendado para mostrar)
              </span>
            ) : (
              <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-800 dark:bg-red-950 dark:text-red-200">
                Modo real (backend fuera de contrato)
              </span>
            )}
```

- [ ] **Step 2: Agregar nota de coordinación al final de `NOTAS_PARA_EL_EQUIPO.md`**

Agregar al final del archivo:

```markdown

**Alcance de MS1 confirmado por el equipo (2026-08-19).** El chat de este front espera que MS1 solo
converse y frene en `estado: "listoParaBuscar"`, sin recomendar destinos ni armar itinerario (eso es
de MS2/MS3, ver `GLOSARIO_DOMINIO.md`). Esto vuelve más urgente el bug ya documentado en
`AUDITORIA_BACKEND.md` §2 ("Gap crítico: el contrato de chat progresivo... NO existe" — el system
prompt correcto está en `promtIA.model.ts` pero como comentario muerto, nunca wireado): con el alcance
ahora confirmado por todo el equipo, el comportamiento actual de `/api/travel-plans/generar`
(recomienda destinos, no frena en `listoParaBuscar`) queda confirmado fuera de contrato, no es una
ambigüedad de diseño pendiente.
```

- [ ] **Step 3: Verificar build**

Run: `npm run build`
Expected: termina limpio.

- [ ] **Step 4: Stage**

```bash
git add -A
```
