import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { APP_ROUTES } from "@/config/app.routes";
import type { PerfilViaje } from "@/modules/chat/chat.types";

import { BusquedaLoadingState } from "../components/BusquedaLoadingState";
import { BusquedaResultadosView } from "../components/BusquedaResultadosView";
import { busquedaService } from "../busqueda.service";
import { convertirArsAUsd, convertirUsdAArs, obtenerCotizacionDolar, type CotizacionDolar } from "../dolar.service";
import { armarParamsDesdeEncuesta } from "../resultados.desdeEncuesta";
import type { BusquedaResultados } from "../results.types";

type Estado =
  | { tipo: "preparando" }
  | { tipo: "destinoAbierto" }
  | { tipo: "faltanDatos"; camposFaltantes: string[] }
  | { tipo: "destinoNoEncontrado"; destinoBuscado: string }
  // presupuesto.moneda === "USD" y no hay ninguna cotización (ni fetch ni cache) para convertir.
  | { tipo: "cotizacionFaltante"; montoUsd: number }
  | { tipo: "buscando" }
  | { tipo: "servicioNoDisponible" }
  | { tipo: "error"; mensaje: string }
  | { tipo: "ok"; resultados: BusquedaResultados };

function formatMonto(monto: number): string {
  return monto.toLocaleString("es-AR");
}

/** Arma el texto "Presupuesto: ARS $X (≈ USD $Y)" — o su variante sin cotización si DolarApi no respondió y el monto ya estaba en ARS (ahí no hace falta convertir para poder buscar, solo para mostrar el equivalente). */
function formatPresupuestoInfo(
  original: { monto: number; moneda: string },
  cotizacion: CotizacionDolar | null
): string {
  const esUsd = original.moneda.toUpperCase() === "USD";

  if (!esUsd) {
    return cotizacion
      ? `Presupuesto: ARS $${formatMonto(original.monto)} (≈ USD $${formatMonto(convertirArsAUsd(original.monto, cotizacion))})`
      : `Presupuesto: ARS $${formatMonto(original.monto)} (cotización del dólar no disponible ahora — no se pudo calcular el equivalente en USD)`;
  }

  // esUsd === true acá siempre viene con cotizacion no-null: el caller
  // resuelve a "cotizacionFaltante" antes de llegar a este punto si no la hay.
  const budgetArs = convertirUsdAArs(original.monto, cotizacion!);
  return `Presupuesto: USD $${formatMonto(original.monto)} (≈ ARS $${formatMonto(budgetArs)})`;
}

function Screen({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div
      role="status"
      className="fv-theme-transition flex flex-col items-center gap-3 rounded-lg border border-dashed p-8 text-center"
    >
      <p className="text-sm font-semibold">{title}</p>
      {children}
    </div>
  );
}

function VolverAlChatButton() {
  return (
    <Button variant="outline" size="sm" asChild>
      <Link to={APP_ROUTES.chat.root}>Volver al chat</Link>
    </Button>
  );
}

export default function ResultsPage() {
  const location = useLocation();
  const viaje = (location.state as { viaje?: PerfilViaje | null } | null)?.viaje ?? null;

  const [estado, setEstado] = useState<Estado>({ tipo: "preparando" });
  const [presupuestoInfo, setPresupuestoInfo] = useState<string | null>(null);

  // React.StrictMode (main.tsx) monta cada componente dos veces en
  // desarrollo, disparando este efecto dos veces — sin esta guarda, salían
  // dos búsquedas reales en paralelo contra MS2 y la que perdía la carrera
  // se mostraba como error genérico ("No pudimos completar la búsqueda"),
  // aunque la otra sí hubiera funcionado. Mismo patrón que ya usan
  // chat.page.tsx (cargarConversacion) y el results.page.tsx viejo (`vigente`).
  const runIdRef = useRef(0);

  async function prepararYBuscar() {
    const runId = ++runIdRef.current;
    const vigente = () => runIdRef.current === runId;

    setEstado({ tipo: "preparando" });

    const [resultadoParams, cotizacion] = await Promise.all([
      armarParamsDesdeEncuesta(viaje),
      obtenerCotizacionDolar(),
    ]);
    if (!vigente()) return;

    if (!resultadoParams.ok) {
      if (resultadoParams.motivo === "destinoAbierto") {
        setEstado({ tipo: "destinoAbierto" });
      } else if (resultadoParams.motivo === "faltanDatos") {
        setEstado({ tipo: "faltanDatos", camposFaltantes: resultadoParams.camposFaltantes });
      } else {
        setEstado({ tipo: "destinoNoEncontrado", destinoBuscado: resultadoParams.destinoBuscado });
      }
      return;
    }

    const { params, presupuestoOriginal } = resultadoParams;
    const esUsd = presupuestoOriginal.moneda.toUpperCase() === "USD";

    if (esUsd && !cotizacion) {
      setEstado({ tipo: "cotizacionFaltante", montoUsd: presupuestoOriginal.monto });
      return;
    }

    const budget = esUsd
      ? convertirUsdAArs(presupuestoOriginal.monto, cotizacion!)
      : presupuestoOriginal.monto;

    setPresupuestoInfo(formatPresupuestoInfo(presupuestoOriginal, cotizacion));
    setEstado({ tipo: "buscando" });

    const resultado = await busquedaService.buscar({ ...params, budget });
    if (!vigente()) return;

    if (resultado.estado === "ok") {
      setEstado({ tipo: "ok", resultados: resultado.datos });
    } else if (resultado.estado === "servicioNoDisponible") {
      setEstado({ tipo: "servicioNoDisponible" });
    } else {
      setEstado({ tipo: "error", mensaje: resultado.mensaje });
    }
  }

  useEffect(() => {
    prepararYBuscar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="fv-theme-transition mx-auto w-full max-w-3xl space-y-6 p-3 sm:p-4">
      <header className="fv-theme-transition flex flex-wrap items-center justify-between gap-2 border-b pb-3">
        <h1 className="text-lg font-bold">Tu viaje</h1>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button variant="ghost" size="sm" asChild>
            <Link to={APP_ROUTES.chat.root}>Volver al chat</Link>
          </Button>
        </div>
      </header>

      {presupuestoInfo && <p className="text-sm font-medium">{presupuestoInfo}</p>}

      {estado.tipo === "preparando" && (
        <p className="text-sm text-muted-foreground">Preparando tu búsqueda...</p>
      )}

      {estado.tipo === "destinoAbierto" && (
        <Screen title="Tu encuesta dejó el destino abierto">
          <p className="max-w-sm text-xs text-muted-foreground">
            Le diste a la IA libertad para elegir el destino, pero para buscar vuelos y hoteles
            reales necesitamos uno concreto — hoy todavía no tenemos un servicio que sugiera
            destinos automáticamente. Volvé al chat y contanos un destino puntual.
          </p>
          <VolverAlChatButton />
        </Screen>
      )}

      {estado.tipo === "faltanDatos" && (
        <Screen title="Todavía falta información para buscar">
          <p className="max-w-sm text-xs text-muted-foreground">
            Nos falta: {estado.camposFaltantes.join(", ")}. Volvé al chat para completar la
            encuesta.
          </p>
          <VolverAlChatButton />
        </Screen>
      )}

      {estado.tipo === "destinoNoEncontrado" && (
        <Screen title="No encontramos ese destino">
          <p className="max-w-sm text-xs text-muted-foreground">
            Buscamos "{estado.destinoBuscado}" y no encontramos ningún destino que coincida.
            Volvé al chat para ajustarlo.
          </p>
          <VolverAlChatButton />
        </Screen>
      )}

      {estado.tipo === "cotizacionFaltante" && (
        <Screen title="No pudimos confirmar la cotización del dólar">
          <p className="max-w-sm text-xs text-muted-foreground">
            Tu presupuesto está en USD ${formatMonto(estado.montoUsd)} y necesitamos convertirlo
            para buscar, pero no logramos obtener la cotización (ni una guardada de antes).
            Reintentá en unos minutos, o indicá tu presupuesto directamente en pesos en el chat.
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={prepararYBuscar}>
              Reintentar
            </Button>
            <VolverAlChatButton />
          </div>
        </Screen>
      )}

      {estado.tipo === "buscando" && <BusquedaLoadingState />}

      {estado.tipo === "servicioNoDisponible" && (
        <Screen title="El servicio de búsqueda todavía no está disponible">
          <p className="max-w-sm text-xs text-muted-foreground">
            No pudimos conectar con el servicio que busca vuelos, hoteles y actividades reales.
            Puede que todavía no esté levantado — probá de nuevo en un rato.
          </p>
          <Button variant="outline" size="sm" onClick={prepararYBuscar}>
            Reintentar
          </Button>
        </Screen>
      )}

      {estado.tipo === "error" && <p className="text-sm text-destructive">{estado.mensaje}</p>}

      {estado.tipo === "ok" && (
        <>
          {estado.resultados.warnings.length > 0 && (
            <div className="fv-theme-transition rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200">
              <strong>Algunas fuentes no respondieron:</strong>
              <ul className="mt-1 list-inside list-disc">
                {estado.resultados.warnings.map((warning, i) => (
                  <li key={i}>{warning}</li>
                ))}
              </ul>
            </div>
          )}

          <BusquedaResultadosView resultados={estado.resultados} />
        </>
      )}
    </div>
  );
}
