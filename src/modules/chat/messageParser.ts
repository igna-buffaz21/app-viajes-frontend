// src/modules/chat/messageParser.ts
/**
 * Heurística FRÁGIL para detectar y extraer la "propuesta final" de viaje a
 * partir del markdown en texto libre que devuelve MS1 (Gemini). MS1 no
 * expone un contrato estructurado para esto — solo prosa con formato
 * reconocible (tabla de presupuesto + días "Día N"). Si esto se reconecta en
 * el futuro (ver nota de desconexión abajo) y el día de mañana MS1 empieza a
 * devolver JSON real, este archivo es el que se reemplaza o se elimina: el
 * resto del chat dependería solo de `isFinalProposal` y `parseFinalProposal`,
 * nunca de los detalles internos de acá.
 *
 * DESCONECTADO del flujo de chat (corrección de alcance 2026-08-19): MS1
 * solo debe conversar y frenar en "listoParaBuscar", nunca recomendar
 * destinos ni armar un itinerario — eso es de MS2/MS3. Nada en
 * `MessageBubble` llama a este archivo hoy. Queda vivo para la futura
 * pantalla de resultados reales, cuando MS3 exista y produzca una
 * `propuesta` (ver GLOSARIO_DOMINIO.md) con forma similar a esta.
 */

export interface BudgetRow {
  label: string;
  value: string;
}

export interface DayBlock {
  day: number;
  content: string;
}

export interface ParsedProposal {
  title: string;
  dateRange: string | null;
  budget: BudgetRow[] | null;
  days: DayBlock[];
  introMarkdown: string;
  outroMarkdown: string;
}

const BUDGET_HEADER_RE = /presupuesto|costo/i;
const VALUE_COLUMN_RE = /usd|ars|monto|precio|costo|\$/i;
const TITLE_SIGNAL_RE = /plan\s+definitivo/i;
const DAY_LINE_RE =
  /^[ \t]*(?:#{1,4}[ \t]*)?(?:\*{1,2}|_{1,2})?[ \t]*Día[ \t]+(\d+)[ \t]*[:.\-]?[ \t]*(?:\*{1,2}|_{1,2})?[ \t]*(.*)$/gim;
const HEADING_LINE_RE = /^#{1,4}[ \t]+/m;
const DATE_RANGE_RE = /\b\d{1,2}\s*(?:al|-|–|a)\s*\d{1,2}\s+de\s+[a-záéíóúñ]+(?:\s+de\s+\d{4})?\b/i;

function findMarkdownTable(markdown: string): string | null {
  const lines = markdown.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const isHeaderRow = line.trim().startsWith("|");
    const nextLine = lines[i + 1] ?? "";
    const isSeparatorRow = /^\s*\|?[\s:|-]+\|?\s*$/.test(nextLine) && nextLine.includes("-");

    if (isHeaderRow && isSeparatorRow && BUDGET_HEADER_RE.test(line)) {
      const blockLines = [line, nextLine];
      let j = i + 2;
      while (j < lines.length && lines[j].trim().startsWith("|")) {
        blockLines.push(lines[j]);
        j++;
      }
      return blockLines.join("\n");
    }
  }
  return null;
}

function parseTableRows(block: string): BudgetRow[] {
  const rows = block
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.startsWith("|"));

  const cellsOf = (line: string) =>
    line
      .split("|")
      .slice(1, -1)
      .map((cell) => cell.trim().replace(/\*\*/g, ""));

  const [headerLine, separatorLine, ...dataLines] = rows;
  if (!headerLine || !separatorLine) return [];

  const headerCells = cellsOf(headerLine);
  const valueColIndex = headerCells.findIndex((cell) => VALUE_COLUMN_RE.test(cell));
  const resolvedValueCol = valueColIndex === -1 ? headerCells.length - 1 : valueColIndex;
  const labelColIndex = resolvedValueCol === 0 ? 1 : 0;

  return dataLines
    .map(cellsOf)
    .filter((cells) => cells.length > Math.max(labelColIndex, resolvedValueCol))
    .map((cells) => ({
      label: cells[labelColIndex] ?? "",
      value: cells[resolvedValueCol] ?? "",
    }))
    .filter((row) => row.label && row.value);
}

interface DayAnalysis {
  days: DayBlock[];
  introEnd: number;
  outroStart: number;
}

function analyzeDayBlocks(markdown: string): DayAnalysis {
  const matches = [...markdown.matchAll(DAY_LINE_RE)];
  if (matches.length === 0) {
    return { days: [], introEnd: markdown.length, outroStart: markdown.length };
  }

  const days: DayBlock[] = [];
  let lastSectionEnd = markdown.length;

  matches.forEach((match, i) => {
    const day = Number(match[1]);
    const inlineText = match[2]?.trim() ?? "";
    const lineEnd = (match.index ?? 0) + match[0].length;
    const nextMatchStart = matches[i + 1]?.index ?? null;

    let sectionEnd: number;
    if (nextMatchStart !== null) {
      sectionEnd = nextMatchStart;
    } else {
      const restOfDoc = markdown.slice(lineEnd);
      const nextHeading = restOfDoc.search(HEADING_LINE_RE);
      sectionEnd = nextHeading === -1 ? markdown.length : lineEnd + nextHeading;
    }

    const trailingLines = markdown.slice(lineEnd, sectionEnd).trim();
    const content = [inlineText, trailingLines].filter(Boolean).join("\n\n");
    days.push({ day, content });

    if (i === matches.length - 1) lastSectionEnd = sectionEnd;
  });

  return { days, introEnd: matches[0].index ?? 0, outroStart: lastSectionEnd };
}

function extractTitle(markdown: string): string {
  const headingMatch = markdown.match(/^#{1,3}[ \t]+(.+)$/m);
  if (headingMatch) return headingMatch[1].trim();

  const firstLine = markdown.split("\n").find((line) => line.trim().length > 0);
  return (firstLine ?? "Tu plan de viaje").trim().slice(0, 80);
}

function extractDateRange(markdown: string): string | null {
  const match = markdown.match(DATE_RANGE_RE);
  return match ? match[0] : null;
}

/**
 * `true` solo cuando el mensaje trae AMBAS señales: una tabla con
 * "presupuesto"/"costo" en el header, Y (al menos 2 marcadores "Día N" O el
 * título "plan definitivo"). Exigir la tabla como ancla evita falsos
 * positivos en turnos intermedios que solo mencionan presupuesto en prosa.
 */
export function isFinalProposal(markdown: string): boolean {
  const table = findMarkdownTable(markdown);
  if (!table) return false;

  const dayMatches = markdown.match(DAY_LINE_RE);
  const hasMultipleDays = (dayMatches?.length ?? 0) >= 2;
  const hasTitleSignal = TITLE_SIGNAL_RE.test(markdown);

  return hasMultipleDays || hasTitleSignal;
}

export function parseFinalProposal(markdown: string): ParsedProposal {
  const table = findMarkdownTable(markdown);
  const { days, introEnd, outroStart } = analyzeDayBlocks(markdown);

  let intro = markdown.slice(0, introEnd);
  let outro = markdown.slice(outroStart);

  if (table) {
    intro = intro.replace(table, "");
    outro = outro.replace(table, "");
  }

  return {
    title: extractTitle(markdown),
    dateRange: extractDateRange(markdown),
    budget: table ? parseTableRows(table) : null,
    days,
    introMarkdown: intro.trim(),
    outroMarkdown: outro.trim(),
  };
}
