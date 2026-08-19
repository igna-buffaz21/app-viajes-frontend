import type { ChatMessage, ChatRespuesta, PerfilViaje, PreguntaPerfil } from "./chat.types";

const MESES: Record<string, number> = {
  enero: 1,
  febrero: 2,
  marzo: 3,
  abril: 4,
  mayo: 5,
  junio: 6,
  julio: 7,
  agosto: 8,
  septiembre: 9,
  setiembre: 9,
  octubre: 10,
  noviembre: 11,
  diciembre: 12,
};

function extraerPerfil(texto: string): PerfilViaje {
  const t = texto.toLowerCase();
  const perfil: PerfilViaje = {};

  const fecha = t.match(
    /el\s+(\d{1,2})\s+de\s+(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|setiembre|octubre|noviembre|diciembre)/
  );
  if (fecha) {
    const mes = MESES[fecha[2]];
    perfil.informacionTemporal = { ...perfil.informacionTemporal, mes };
    perfil.fechaSalida = `${fecha[1]} de ${fecha[2]}`;
  }

  const dias = t.match(/(\d{1,3})\s*d[ií]as/);
  if (dias) {
    perfil.informacionTemporal = {
      ...perfil.informacionTemporal,
      duracionDiasAproximada: Number(dias[1]),
    };
  }

  const presupuesto = t.match(/(\d[\d.,]*)\s*(usd|dolares|dólares|ars|pesos|eur|euros)/);
  if (presupuesto) {
    const moneda = presupuesto[2].startsWith("usd") || presupuesto[2].startsWith("dolar")
      ? "USD"
      : presupuesto[2].startsWith("eur")
        ? "EUR"
        : "ARS";
    perfil.presupuesto = {
      monto: Number(presupuesto[1].replace(/[.,]/g, "")),
      moneda,
      incluyeTransporte: !/sin\s+transporte/.test(t),
    };
  }

  const viajeros = t.match(/somos\s+(\d+)/) ?? t.match(/(\d+)\s*(personas|amigos|viajeros)/);
  if (viajeros) {
    perfil.viajeros = { cantidadTotal: Number(viajeros[1]) };
  }

  const salida = t.match(/salimos?\s+desde\s+([a-záéíóúñ\s]+?)(?:,|\.|$)/);
  if (salida) {
    perfil.lugarSalida = { ciudad: salida[1].trim() };
  }

  const clima: string[] = [];
  if (/\bcalor|c[aá]lido\b/.test(t)) clima.push("calido");
  if (/\bfr[ií]o\b/.test(t)) clima.push("frio");

  const intereses: string[] = [];
  if (/\bplaya\b/.test(t)) intereses.push("playa");
  if (/\bmonta[ñn]a\b/.test(t)) intereses.push("montaña");
  if (/\bnaturaleza\b/.test(t)) intereses.push("naturaleza");
  if (/\bcultura\b/.test(t)) intereses.push("cultura");

  if (clima.length || intereses.length) {
    perfil.preferencias = { ...perfil.preferencias, clima, intereses, tipoViaje: intereses };
  }

  if (/\btranquilo|relax|relajado\b/.test(t)) {
    perfil.preferencias = { ...perfil.preferencias, ritmoViaje: "tranquilo" };
  } else if (/\bintenso|activo\b/.test(t)) {
    perfil.preferencias = { ...perfil.preferencias, ritmoViaje: "intenso" };
  }

  if (/conocer gente|socializar/.test(t)) {
    perfil.preferencias = { ...perfil.preferencias, socializar: "prioridad" };
  }

  return perfil;
}

const PREGUNTAS_CANDIDATAS: {
  faltaSi: (p: PerfilViaje) => boolean;
  pregunta: PreguntaPerfil;
}[] = [
  {
    faltaSi: (p) => !p.fechaSalida,
    pregunta: {
      campo: "fechaSalida",
      pregunta: "¿Para cuándo estás pensando viajar?",
      motivo: "Necesito la fecha aproximada de salida para buscar opciones disponibles.",
    },
  },
  {
    faltaSi: (p) => !p.informacionTemporal?.duracionDiasAproximada,
    pregunta: {
      campo: "informacionTemporal.duracionDiasAproximada",
      pregunta: "¿Cuántos días tenés pensado viajar?",
      motivo: "La duración cambia mucho las opciones de vuelos y alojamiento.",
    },
  },
  {
    faltaSi: (p) => !p.presupuesto?.monto,
    pregunta: {
      campo: "presupuesto.monto",
      pregunta: "¿Cuál es tu presupuesto aproximado y en qué moneda?",
      motivo: "El presupuesto es clave para descartar opciones que no encajan.",
    },
  },
  {
    faltaSi: (p) => !p.viajeros?.cantidadTotal,
    pregunta: {
      campo: "viajeros.cantidadTotal",
      pregunta: "¿Cuántas personas viajan?",
      motivo: "La cantidad de viajeros afecta precios y disponibilidad.",
    },
  },
  {
    faltaSi: (p) => !p.lugarSalida?.ciudad,
    pregunta: {
      campo: "lugarSalida.ciudad",
      pregunta: "¿Desde qué ciudad salís?",
      motivo: "Necesito el origen para buscar vuelos.",
    },
  },
  {
    faltaSi: (p) => !p.preferencias?.ritmoViaje,
    pregunta: {
      campo: "preferencias.ritmoViaje",
      pregunta: "¿Cómo te gustaría que sea el ritmo del viaje?",
      motivo: "Ayuda a elegir actividades acordes (tranquilo, equilibrado o intenso).",
    },
  },
];

const CAMPOS_MINIMOS: ((p: PerfilViaje) => boolean)[] = [
  (p) => !!p.fechaSalida,
  (p) => !!p.informacionTemporal?.duracionDiasAproximada,
  (p) => !!p.presupuesto?.monto,
  (p) => !!p.viajeros?.cantidadTotal,
  (p) => !!p.lugarSalida?.ciudad,
];

/**
 * Simula el contrato A/B del encargo (estado/viaje/preguntas) con heurísticas
 * simples de texto, 100% en el cliente, sin llamar a ningún backend. Sirve
 * para probar la UI rica (chips, perfil acumulado) sin depender de que
 * MicroServicioGrupo2 implemente el endpoint real — ver AUDITORIA_BACKEND.md.
 */
export function enviarMensajeMock(historial: ChatMessage[]): ChatRespuesta {
  const textoAcumulado = historial
    .filter((m) => m.role === "usuario")
    .map((m) => m.contenido)
    .join(". ");

  const viaje = extraerPerfil(textoAcumulado);
  const listo = CAMPOS_MINIMOS.every((chequeo) => chequeo(viaje));

  if (listo) {
    return {
      mensaje: "Ya tengo la información necesaria para buscar recomendaciones de viaje.",
      estado: "listoParaBuscar",
      viaje,
      preguntas: [],
    };
  }

  const preguntas = PREGUNTAS_CANDIDATAS.filter((c) => c.faltaSi(viaje))
    .slice(0, 3)
    .map((c) => c.pregunta);

  return {
    mensaje: "Voy armando tu perfil de viaje. Necesito algunos datos más para poder buscar.",
    estado: "incompleto",
    viaje,
    preguntas,
  };
}
