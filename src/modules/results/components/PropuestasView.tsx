import { Plane, BedDouble, Ticket, MapPin } from "lucide-react";

import { cn } from "@/lib/utils";

import type { Propuesta } from "../results.types";

function formatMonto(monto: number, moneda: string): string {
  return `${moneda} ${monto.toLocaleString("es-AR")}`;
}

function LineaItem({
  icon: Icon,
  iconClassName,
  titulo,
  subtitulo,
  detalle,
  precio,
  moneda,
  /**
   * "estimado" = MS3/Gemini inventó este precio porque MS2 no encontró
   * datos reales (esReal:false) — comportamiento intencional de MS3, no un
   * bug (confirmado con el equipo). Acá solo se le baja la jerarquía
   * visual para que no se confunda con un precio real: texto más chico,
   * atenuado, con "~" adelante — en vez del mismo font-mono grande y
   * confiado que se usa para precios reales.
   */
  precioVariant = "normal",
}: {
  icon: typeof Plane;
  iconClassName: string;
  titulo: string;
  subtitulo?: string;
  detalle?: string;
  precio: number;
  moneda: string;
  precioVariant?: "normal" | "estimado";
}) {
  return (
    <div className="flex items-start gap-2.5">
      <Icon className={`mt-0.5 size-4 flex-none ${iconClassName}`} />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-foreground">{titulo}</p>
        {subtitulo && <p className="text-xs text-muted-foreground">{subtitulo}</p>}
        {detalle && <p className="mt-1 text-xs text-muted-foreground">{detalle}</p>}
      </div>
      <span
        className={cn(
          "flex-none tabular-nums",
          precioVariant === "estimado"
            ? "font-mono text-xs font-medium text-muted-foreground"
            : "font-mono text-sm font-semibold text-foreground"
        )}
      >
        {precioVariant === "estimado" ? "~ " : ""}
        {formatMonto(precio, moneda)}
      </span>
    </div>
  );
}

function PropuestaCard({ propuesta }: { propuesta: Propuesta }) {
  const moneda = propuesta.precioTotal.moneda;
  const vueloEstimado = !propuesta.vuelo.esReal;

  return (
    <div className="fv-theme-transition flex flex-col rounded-2xl border border-border bg-card p-4 shadow-sm transition-shadow hover:shadow-md">
      {/* Encabezado con el destino — distingue a cuál corresponde la card cuando la búsqueda cotizó 2-3 destinos a la vez. */}
      <p className="mb-1 flex items-center gap-1 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
        <MapPin className="size-3" />
        {propuesta.destino}
      </p>

      <div className="flex items-baseline justify-between gap-2">
        <span className="font-mono text-2xl font-bold tabular-nums text-primary">
          {formatMonto(propuesta.precioTotal.monto, propuesta.precioTotal.moneda)}
        </span>
        <span className="text-xs text-muted-foreground">total estimado</span>
      </div>
      {vueloEstimado && (
        <p className="mt-0.5 text-[11px] text-muted-foreground">*Incluye estimación de vuelo</p>
      )}
      <p className="mt-2 text-xs text-muted-foreground">{propuesta.resumen}</p>

      <div className="mt-4 space-y-3 divide-y divide-border [&>*+*]:pt-3">
        <LineaItem
          icon={Plane}
          iconClassName="text-primary"
          titulo={`${propuesta.vuelo.aerolinea} · ${propuesta.vuelo.origen} → ${propuesta.vuelo.destino}`}
          subtitulo={`${propuesta.vuelo.fechaIda} — ${propuesta.vuelo.fechaVuelta}`}
          detalle={vueloEstimado ? propuesta.vuelo.detalle : undefined}
          precio={propuesta.vuelo.precio}
          moneda={moneda}
          precioVariant={vueloEstimado ? "estimado" : "normal"}
        />

        <LineaItem
          icon={BedDouble}
          iconClassName="text-accent"
          titulo={propuesta.hospedaje.nombre}
          subtitulo={
            propuesta.hospedaje.puntuacion !== null
              ? `★ ${propuesta.hospedaje.puntuacion} puntuación`
              : undefined
          }
          detalle={propuesta.hospedaje.detalle}
          precio={propuesta.hospedaje.precio}
          moneda={moneda}
        />

        <div>
          <p className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
            <Ticket className="size-3.5" />
            Actividades
          </p>
          <ul className="space-y-2">
            {propuesta.actividades.map((actividad, i) => (
              <li key={i} className="flex items-start justify-between gap-2 text-xs">
                <span className="min-w-0 flex-1">
                  <span className="block text-foreground">{actividad.nombre}</span>
                  {actividad.descripcion && (
                    <span className="mt-0.5 block text-muted-foreground">{actividad.descripcion}</span>
                  )}
                </span>
                <span className="flex-none font-mono tabular-nums text-muted-foreground">
                  {formatMonto(actividad.precio, moneda)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

/**
 * 3 propuestas completas armadas por MS3 (vuelo + hospedaje + actividades +
 * precio total + resumen) — reemplaza a BusquedaResultadosView en
 * /resultados (que mostraba listas sueltas de MS2 sin armar). Siempre
 * exactamente 3 propuestas (MS3 lo valida así, ver results.types.ts).
 */
export function PropuestasView({ propuestas }: { propuestas: Propuesta[] }) {
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {propuestas.map((propuesta, i) => (
        <PropuestaCard key={i} propuesta={propuesta} />
      ))}
    </div>
  );
}
