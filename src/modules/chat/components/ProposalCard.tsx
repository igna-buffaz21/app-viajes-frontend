// Desconectado del flujo de chat (corrección de alcance 2026-08-19): MS1 no
// debe producir "propuestas finales", eso es de MS2/MS3. Nada importa este
// componente hoy — queda para la futura pantalla de resultados reales.

import { useState } from "react";
import { ChevronDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

import type { DayBlock, ParsedProposal } from "../messageParser";
import { MarkdownMessage } from "./MarkdownMessage";

interface ProposalCardProps {
  proposal: ParsedProposal;
  onElegir: () => void;
}

function DayAccordionItem({ day }: { day: DayBlock }) {
  const [open, setOpen] = useState(false);

  return (
    <Collapsible open={open} onOpenChange={setOpen} className="border-b border-border last:border-b-0">
      <CollapsibleTrigger className="flex min-h-[52px] w-full items-center gap-3 px-4 py-3 text-left">
        <span className="flex size-7 flex-none items-center justify-center rounded-full bg-secondary font-mono text-[12px] font-medium text-primary-strong">
          {day.day}
        </span>
        <span className="flex-1 font-display text-sm font-semibold tracking-[-0.015em]">Día {day.day}</span>
        <ChevronDown className={cn("size-4 flex-none text-muted-foreground transition-transform", open && "rotate-180")} />
      </CollapsibleTrigger>
      <CollapsibleContent className="px-4 pb-4 pl-[52px]">
        <MarkdownMessage content={day.content} className="text-[13.5px]" />
      </CollapsibleContent>
    </Collapsible>
  );
}

export function ProposalCard({ proposal, onElegir }: ProposalCardProps) {
  const { title, dateRange, budget, days, introMarkdown, outroMarkdown } = proposal;

  return (
    <div className="fv-theme-transition mr-auto w-full max-w-[560px] overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <div className="border-b border-border bg-primary px-5 py-4">
        <div className="font-display text-lg font-semibold tracking-[-0.02em] text-primary-foreground">{title}</div>
        {dateRange && (
          <span className="mt-2 inline-flex items-center rounded-full bg-white/15 px-3 py-1 text-[11.5px] text-primary-foreground">
            {dateRange}
          </span>
        )}
      </div>

      {introMarkdown && (
        <div className="px-5 pt-4">
          <MarkdownMessage content={introMarkdown} />
        </div>
      )}

      {budget && budget.length > 0 && (
        <div className="px-5 pt-4">
          <div className="text-[11px] font-semibold tracking-[0.08em] text-muted-foreground uppercase">Presupuesto</div>
          <div className="mt-2 overflow-hidden rounded-[var(--radius-md)] border border-border">
            <table className="w-full border-collapse text-[13.5px]">
              <tbody>
                {budget.map((row) => (
                  <tr key={row.label} className={cn("border-b border-border last:border-b-0", /total/i.test(row.label) && "bg-secondary")}>
                    <td className="px-3 py-2">{row.label}</td>
                    <td className="px-3 py-2 text-right font-mono tabular-nums">{row.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {days.length > 0 && (
        <div className="px-5 pt-4">
          <div className="text-[11px] font-semibold tracking-[0.08em] text-muted-foreground uppercase">Itinerario día por día</div>
          <div className="mt-2 overflow-hidden rounded-[var(--radius-md)] border border-border">
            {days.map((day) => (
              <DayAccordionItem key={day.day} day={day} />
            ))}
          </div>
        </div>
      )}

      {outroMarkdown && (
        <div className="px-5 pt-4">
          <MarkdownMessage content={outroMarkdown} />
        </div>
      )}

      <div className="px-5 py-4">
        <Button onClick={onElegir} className="h-12 w-full text-[15px]">
          Elegir esta propuesta
        </Button>
      </div>
    </div>
  );
}
