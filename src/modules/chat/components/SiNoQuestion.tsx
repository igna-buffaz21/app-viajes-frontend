import { cn } from "@/lib/utils";

// Chips propios para tipoPregunta "siNo" — mismo estilo de botón redondeado
// que usa QuestionCard para sus opciones, separado en su propio componente
// porque acá no hay estado de selección múltiple ni "Otro": un click responde.
interface SiNoQuestionProps {
  onResponder: (texto: string) => void;
}

const OPCIONES_SI_NO = ["Sí", "No"] as const;

export function SiNoQuestion({ onResponder }: SiNoQuestionProps) {
  return (
    <div className="mt-2 flex gap-1.5">
      {OPCIONES_SI_NO.map((opcion) => (
        <button
          key={opcion}
          type="button"
          onClick={() => onResponder(opcion)}
          className={cn("rounded-full border px-2.5 py-1 text-xs transition-colors hover:bg-muted")}
        >
          {opcion}
        </button>
      ))}
    </div>
  );
}
