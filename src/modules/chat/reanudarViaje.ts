import type { PerfilViaje } from "./chat.types";

/** Estado que /resultados le pasa a /chat vía router state para retomar sin perder los datos ya juntados (ver ChatPage). */
export interface RetomarViajeState {
  viaje: PerfilViaje;
  motivo: "destinoAbierto" | "faltanDatos" | "destinoNoEncontrado";
}

/**
 * Arma, en lenguaje natural, un resumen de todo lo que la encuesta ya sabía
 * de este viaje (presupuesto, fechas, origen, viajeros, preferencias). Se
 * usa para no hacerle repetir toda la encuesta al usuario cuando desde
 * /resultados hace falta volver al chat a completar algo (destino abierto o
 * datos faltantes para MS2) — ver ChatPage, que arranca SIEMPRE una
 * conversación NUEVA con esto precargado en el input, porque MS1 rechaza
 * con 409 cualquier mensaje a una conversación que ya marcó "completo"
 * (confirmado con curl real, no es una suposición — ver conversación previa
 * con Grupo 2).
 */
export function construirResumenViaje(viaje: PerfilViaje): string {
  const partes: string[] = [];

  // Solo se incluye si había un destino CONCRETO (no "destinosAbiertos").
  // En el motivo "destinoNoEncontrado" esto va a mostrar el destino que
  // falló en MS2 — a propósito: el usuario ve qué había puesto y lo puede
  // editar/reemplazar directo en el input precargado, en vez de perderlo
  // sin ningún rastro. En "destinoAbierto" no hay ninguno que mostrar.
  const destinoConcreto = viaje.destino?.lugaresPreferidos?.[0]?.trim();
  if (destinoConcreto && !viaje.destino?.destinosAbiertos) {
    partes.push(`Destino: ${destinoConcreto}.`);
  }

  if (viaje.lugarSalida?.ciudad) {
    const lugar = [viaje.lugarSalida.ciudad, viaje.lugarSalida.provincia, viaje.lugarSalida.pais]
      .filter(Boolean)
      .join(", ");
    partes.push(`Salgo desde ${lugar}.`);
  }

  if (viaje.fechaSalida) {
    partes.push(
      viaje.fechaFin
        ? `Quiero viajar del ${viaje.fechaSalida} al ${viaje.fechaFin}.`
        : `Quiero viajar el ${viaje.fechaSalida}.`
    );
  }

  if (viaje.viajeros?.cantidadTotal) {
    partes.push(
      `Somos ${viaje.viajeros.cantidadTotal} persona${viaje.viajeros.cantidadTotal > 1 ? "s" : ""}.`
    );
  }

  if (viaje.presupuesto?.monto) {
    const incluye = viaje.presupuesto.incluyeTransporte ? " (incluye transporte)" : "";
    partes.push(
      `Presupuesto: ${viaje.presupuesto.monto} ${viaje.presupuesto.moneda ?? ""}${incluye}.`.replace(
        /\s+\./,
        "."
      )
    );
  }

  if (viaje.preferencias?.tipoViaje?.length) {
    partes.push(`Me interesa: ${viaje.preferencias.tipoViaje.join(", ")}.`);
  }

  if (viaje.preferencias?.clima?.length) {
    partes.push(`Clima preferido: ${viaje.preferencias.clima.join(", ")}.`);
  }

  return partes.join(" ");
}

/** Texto que se agrega al resumen cuando lo que falta puntualmente es un destino concreto (motivo "destinoAbierto"). */
export const PEDIDO_DESTINO_CONCRETO = "Ahora quiero elegir un destino concreto: ";
