// src/modules/chat/structuredResponseParser.ts
/**
 * Parsea el campo `respuesta` (texto libre) que devuelve hoy
 * `POST /api/travel-plans/generar`, buscando el contrato de encuesta
 * progresiva ya confirmado con el equipo de backend: un JSON con
 * `estado: "incompleto" | "listoParaBuscar"`, `mensaje`, `viaje`,
 * `preguntas: [{campo, pregunta, motivo}]` y opcionalmente
 * `camposFaltantesImportantes: string[]`.
 *
 * Hoy MS1 todavía NO implementa ese prompt — devuelve markdown libre (ver
 * AUDITORIA_BACKEND.md) — así que en la práctica este parser siempre
 * devuelve `null` por ahora y `chat.real.adapter.ts` cae al comportamiento
 * de texto plano de siempre. Existe preparado para el día que el equipo de
 * backend active el prompt real, sin tener que tocar el front en ese
 * momento (más allá de acordar la forma exacta si difiere de esto).
 *
 * Los LLM suelen envolver el JSON en un bloque de código markdown
 * (```json ... ```) aunque el prompt pida "JSON puro sin texto extra" — se
 * intenta extraer ese bloque antes de descartarlo. Fuera de alcance a
 * propósito: JSON mezclado con prosa SIN bloque de código (ej. "Acá está: {
 * ... }") — un regex tipo /\{[\s\S]*\}/ para ese caso es demasiado propenso
 * a matchear basura; si en la práctica el modelo hace eso, se suma acá.
 *
 * Nunca lanza: ante cualquier forma inesperada devuelve `null` y el llamador
 * decide el fallback.
 */

import type { ChatRespuesta, PerfilViaje, PreguntaPerfil } from "./chat.types";

const CODE_FENCE_RE = /```(?:json)?\s*([\s\S]*?)```/i;

interface RespuestaEstructuradaCruda {
  mensaje: string;
  estado: "incompleto" | "listoParaBuscar";
  viaje?: PerfilViaje | null;
  preguntas?: unknown;
  camposFaltantesImportantes?: unknown;
}

function intentarParsear(texto: string): unknown | null {
  const limpio = texto.trim();
  if (!limpio) return null;
  try {
    return JSON.parse(limpio);
  } catch {
    return null;
  }
}

/** Prueba el texto completo como JSON puro; si falla, busca un bloque ```json ... ```. */
function extraerCandidatoJSON(texto: string): unknown | null {
  const directo = intentarParsear(texto);
  if (directo !== null) return directo;

  const fence = texto.match(CODE_FENCE_RE);
  if (!fence) return null;

  return intentarParsear(fence[1]);
}

function esPreguntaValida(valor: unknown): valor is PreguntaPerfil {
  if (typeof valor !== "object" || valor === null) return false;
  const v = valor as Record<string, unknown>;
  return typeof v.campo === "string" && typeof v.pregunta === "string" && typeof v.motivo === "string";
}

function esRespuestaEstructuradaValida(valor: unknown): valor is RespuestaEstructuradaCruda {
  if (typeof valor !== "object" || valor === null) return false;
  const v = valor as Record<string, unknown>;
  return typeof v.mensaje === "string" && (v.estado === "incompleto" || v.estado === "listoParaBuscar");
}

export function parseRespuestaEstructurada(raw: string): ChatRespuesta | null {
  const candidato = extraerCandidatoJSON(raw);
  if (!esRespuestaEstructuradaValida(candidato)) return null;

  const preguntas = Array.isArray(candidato.preguntas) ? candidato.preguntas.filter(esPreguntaValida) : [];

  const camposFaltantesImportantes = Array.isArray(candidato.camposFaltantesImportantes)
    ? candidato.camposFaltantesImportantes.filter((c): c is string => typeof c === "string")
    : undefined;

  return {
    mensaje: candidato.mensaje,
    estado: candidato.estado,
    viaje: candidato.viaje ?? null,
    preguntas,
    camposFaltantesImportantes,
  };
}
