import type { PerfilViaje } from "../chat.types";

interface SurveySummaryProps {
  viaje: PerfilViaje | null;
}

function formatDestino(viaje: PerfilViaje): string | null {
  const preferido = viaje.destino?.lugaresPreferidos?.[0];
  const partes = [preferido?.ciudad, preferido?.region, preferido?.pais].filter(Boolean);
  if (partes.length > 0) return partes.join(", ");
  return viaje.destino?.destinosAbiertos ? "Destino abierto" : null;
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
