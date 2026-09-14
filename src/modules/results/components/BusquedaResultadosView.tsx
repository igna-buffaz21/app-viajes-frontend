import type { ComponentType, ReactNode } from "react";
import { Plane, BedDouble, Ticket, Star } from "lucide-react";

import { cn } from "@/lib/utils";

import type { Actividad, BusquedaResultados, Hotel, Precio, Vuelo } from "../results.types";

/**
 * CONFIRMADO con datos reales de POST /api/viaje (2026-09-14): actividades
 * a veces trae precioPorPersona = "No especificado" (texto, sin ningún
 * dígito) — parsePrecio (results.mapper.ts) no tenía forma de señalar "no
 * hay precio" y devolvía silenciosamente monto:0, mostrando un engañoso
 * "USD 0". Acá se detecta ese caso (monto no finito, ver el fix en
 * parsePrecio) y se muestra un texto claro en vez de un precio inventado.
 */
function formatPrecio(precio: Precio): string {
  if (!Number.isFinite(precio.monto)) return "Precio no disponible";
  return `${precio.moneda} ${precio.monto.toLocaleString("es-AR")}`;
}

interface BusquedaResultadosViewProps {
  resultados: BusquedaResultados;
}

const TONOS = {
  primary: { badge: "bg-primary-soft text-primary", precio: "text-primary" },
  accent: { badge: "bg-accent-soft text-accent", precio: "text-accent" },
} as const;

function SectionHeader({
  icon: Icon,
  titulo,
  cantidad,
  tono,
}: {
  icon: ComponentType<{ className?: string }>;
  titulo: string;
  cantidad: number;
  tono: keyof typeof TONOS;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className={cn("inline-flex size-9 flex-none items-center justify-center rounded-full", TONOS[tono].badge)}>
        <Icon className="size-4" />
      </span>
      <div>
        <h2 className="text-base font-semibold text-foreground">{titulo}</h2>
        <p className="text-xs text-muted-foreground">
          {cantidad === 0
            ? "No encontramos opciones esta vez"
            : `${cantidad} ${cantidad === 1 ? "opción encontrada" : "opciones encontradas"}`}
        </p>
      </div>
    </div>
  );
}

function CardBase({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div
      className={cn(
        "fv-theme-transition rounded-2xl border border-border bg-card p-4 shadow-sm transition-shadow hover:shadow-md",
        className
      )}
    >
      {children}
    </div>
  );
}

function VueloCard({ vuelo }: { vuelo: Vuelo }) {
  const multiTramo = vuelo.legs.length > 1;
  return (
    <CardBase>
      <p className="font-mono text-2xl font-bold tabular-nums text-primary">{formatPrecio(vuelo.precio)}</p>

      <div className={cn("mt-3", multiTramo && "divide-y divide-border")}>
        {vuelo.legs.map((leg, j) => (
          <div key={j} className={cn("space-y-0.5", multiTramo && j > 0 && "pt-2.5", multiTramo && j === 0 && "pb-2.5")}>
            {multiTramo && (
              <p className="text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">
                {j === 0 ? "Ida" : "Vuelta"}
              </p>
            )}
            <p className="text-sm font-medium text-foreground">{leg.route}</p>
            <p className="text-xs text-muted-foreground">
              {leg.time} · {leg.airline} · {leg.stops}
            </p>
          </div>
        ))}
      </div>
    </CardBase>
  );
}

function HotelCard({ hotel }: { hotel: Hotel }) {
  return (
    <CardBase>
      <div className="flex items-start justify-between gap-2">
        <p className="min-w-0 flex-1 font-medium text-foreground">{hotel.nombre}</p>
        {hotel.rating !== null && (
          // text-foreground, no accent-foreground: accent-foreground vale
          // lo mismo (casi negro) en claro y oscuro, invisible sobre
          // bg-accent-soft en dark mode — mismo bug ya corregido en el
          // banner de warnings de results.page.tsx, confirmado con
          // evidencia real (2026-09-14): el rating SÍ llega del backend
          // (ver diagnóstico), esto era puramente un problema de contraste.
          <span className="inline-flex flex-none items-center gap-1 rounded-full bg-accent-soft px-2 py-0.5 text-xs font-semibold text-foreground">
            <Star className="size-3 fill-accent text-accent" />
            {hotel.rating}
          </span>
        )}
      </div>
      <p className="mt-2 font-mono text-xl font-bold tabular-nums text-primary">{formatPrecio(hotel.precio)}</p>
    </CardBase>
  );
}

function ActividadCard({ actividad }: { actividad: Actividad }) {
  return (
    <CardBase>
      <p className="font-medium text-foreground">{actividad.titulo}</p>
      {actividad.descripcionBreve && (
        <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{actividad.descripcionBreve}</p>
      )}
      {/*
        CONFIRMADO con datos reales (2026-09-14): duracionEstimada no es
        "9h 15m" como asumía el diseño anterior — MS2 concatena duración +
        idioma + categoría en un solo string (ej. "9h 15m - 10h Español
        Excursiones de un día"). Forzarlo en una fila junto al precio
        (flex justify-between) lo cortaba/desbordaba. Ahora va apilado,
        debajo, con ancho completo para poder wrappear — mismo criterio de
        jerarquía que vuelos/hoteles (precio destacado en font-mono, resto
        secundario) pero sin asumir que el texto secundario es corto.
      */}
      <div className="mt-3 space-y-1 border-t border-border pt-2.5">
        <p className="font-mono text-lg font-bold tabular-nums text-primary">
          {formatPrecio(actividad.precio)}
        </p>
        <p className="text-xs text-muted-foreground">{actividad.duracionEstimada}</p>
      </div>
    </CardBase>
  );
}

/**
 * Grilla de vuelos/hoteles/actividades — extraída de results.page.tsx para
 * reusarla tal cual en /explorar (datos reales) sin duplicar el diseño de
 * las cards. Las diferencias entre "datos de ejemplo" (banner) y "datos
 * reales" (warnings de MS2) las maneja cada página que la usa, no este
 * componente.
 */
export function BusquedaResultadosView({ resultados }: BusquedaResultadosViewProps) {
  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <SectionHeader icon={Plane} titulo="Vuelos" cantidad={resultados.vuelos.length} tono="primary" />
        {resultados.vuelos.length > 0 && (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {resultados.vuelos.map((vuelo, i) => (
              <VueloCard key={i} vuelo={vuelo} />
            ))}
          </div>
        )}
      </section>

      <section className="space-y-4">
        <SectionHeader icon={BedDouble} titulo="Hoteles" cantidad={resultados.hoteles.length} tono="accent" />
        {resultados.hoteles.length > 0 && (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {resultados.hoteles.map((hotel, i) => (
              <HotelCard key={i} hotel={hotel} />
            ))}
          </div>
        )}
      </section>

      <section className="space-y-4">
        <SectionHeader icon={Ticket} titulo="Actividades" cantidad={resultados.actividades.length} tono="primary" />
        {resultados.actividades.length > 0 && (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {resultados.actividades.map((actividad, i) => (
              <ActividadCard key={i} actividad={actividad} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
