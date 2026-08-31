import { useEffect, useRef, useState } from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { obtenerSugerencias } from "../busqueda.real.adapter";
import type { Sugerencia } from "../results.types";

interface DestinoAutocompleteProps {
  disabled?: boolean;
  onSeleccionar: (sugerencia: Sugerencia) => void;
}

// No hay librería de combobox en el proyecto (ver package.json) — este es
// un dropdown propio y simple a propósito, sin agregar una dependencia
// nueva solo para esto.
export function DestinoAutocomplete({ disabled, onSeleccionar }: DestinoAutocompleteProps) {
  const [texto, setTexto] = useState("");
  const [sugerencias, setSugerencias] = useState<Sugerencia[]>([]);
  const [abierto, setAbierto] = useState(false);
  const [cargando, setCargando] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const idRef = useRef(0);

  useEffect(() => {
    return () => clearTimeout(debounceRef.current);
  }, []);

  function handleChange(valor: string) {
    setTexto(valor);
    clearTimeout(debounceRef.current);

    if (!valor.trim()) {
      setSugerencias([]);
      setAbierto(false);
      return;
    }

    const idActual = ++idRef.current;
    debounceRef.current = setTimeout(async () => {
      setCargando(true);
      try {
        const resultado = await obtenerSugerencias(valor);
        // Descarta respuestas de requests viejos si el usuario siguió tipeando.
        if (idActual === idRef.current) {
          setSugerencias(resultado);
          setAbierto(true);
        }
      } catch {
        if (idActual === idRef.current) {
          setSugerencias([]);
          setAbierto(false);
        }
      } finally {
        if (idActual === idRef.current) setCargando(false);
      }
    }, 300);
  }

  function handleSeleccionar(sugerencia: Sugerencia) {
    setTexto(sugerencia.displayName);
    setAbierto(false);
    setSugerencias([]);
    onSeleccionar(sugerencia);
  }

  return (
    <div className="relative">
      <Label htmlFor="destino-autocomplete">Destino</Label>
      <Input
        id="destino-autocomplete"
        className="mt-1 h-11"
        value={texto}
        onChange={(e) => handleChange(e.target.value)}
        onFocus={() => sugerencias.length > 0 && setAbierto(true)}
        onBlur={() => setTimeout(() => setAbierto(false), 150)}
        placeholder="¿A dónde querés ir?"
        disabled={disabled}
        autoComplete="off"
        role="combobox"
        aria-expanded={abierto}
        aria-autocomplete="list"
      />
      {cargando && (
        <p className="mt-1 text-xs text-muted-foreground">Buscando destinos...</p>
      )}
      {abierto && sugerencias.length > 0 && (
        <ul className="fv-theme-transition absolute z-10 mt-1 max-h-64 w-full overflow-y-auto rounded-lg border bg-background shadow-md">
          {sugerencias.map((sugerencia) => (
            <li key={sugerencia.slug}>
              <button
                type="button"
                className="flex w-full min-h-11 flex-col items-start px-3 py-2 text-left text-sm hover:bg-accent focus-visible:bg-accent focus-visible:outline-none"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => handleSeleccionar(sugerencia)}
              >
                <span className="font-medium">{sugerencia.displayName}</span>
                <span className="text-xs text-muted-foreground">
                  {sugerencia.cityName}, {sugerencia.countryName} · {sugerencia.iata}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
