import { useLayoutEffect, useRef } from "react";
import type { KeyboardEvent } from "react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

// 44px ≈ una línea (calza con el h-11 que ya usan Button/Input en el resto
// del chat). 168px ≈ 6-7 líneas visibles — pasado ese punto el textarea deja
// de crecer y scrollea internamente en vez de empujar el layout.
const MIN_HEIGHT_PX = 44;
const MAX_HEIGHT_PX = 168;

interface ChatInputAreaProps {
  value: string;
  onChange: (value: string) => void;
  onEnviar: () => void;
  disabled?: boolean;
  placeholder?: string;
}

/**
 * Textarea auto-expandible del chat: crece con el contenido hasta
 * MAX_HEIGHT_PX y de ahí en más scrollea internamente. Enter manda el
 * mensaje, Shift+Enter hace salto de línea — <textarea> no interpreta Enter
 * como submit de formulario por sí solo (a diferencia de <input>), así que
 * se maneja acá explícitamente.
 */
export function ChatInputArea({ value, onChange, onEnviar, disabled, placeholder }: ChatInputAreaProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // useLayoutEffect (no useEffect): recalcula la altura antes de pintar,
  // para que no se vea un frame con la altura vieja al borrar texto o al
  // precargar el input desde reanudarViaje.ts con varias líneas de una.
  useLayoutEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, MAX_HEIGHT_PX)}px`;
  }, [value]);

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      if (!disabled && value.trim()) onEnviar();
    }
  }

  return (
    <div className="flex items-end gap-2">
      <Textarea
        ref={textareaRef}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        rows={1}
        style={{ height: MIN_HEIGHT_PX, maxHeight: MAX_HEIGHT_PX }}
        className="fv-scroll-thin overflow-y-auto py-2.5"
      />
      <Button type="submit" className="h-11 flex-none" disabled={disabled || !value.trim()}>
        Enviar
      </Button>
    </div>
  );
}
