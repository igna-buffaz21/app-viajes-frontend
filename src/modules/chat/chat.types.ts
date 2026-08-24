export type ChatRole = "usuario" | "asistente";

export interface ChatMessage {
  role: ChatRole;
  contenido: string;
}

export interface PreguntaPerfil {
  campo: string;
  pregunta: string;
  motivo: string;
}

export type EstadoPerfil = "incompleto" | "listoParaBuscar";

// `null` = todavía no se le preguntó / no contestó (confirmado con el JSON
// real del prompt de encuesta progresiva, no solo "no aplica").
export type NivelPreferencia = "nada" | "poca" | "bastante" | "prioridad" | null;

// Contrato B del encargo: perfil de viaje acumulado (todo opcional, se va
// completando a medida que el usuario responde).
export interface PerfilViaje {
  usuario?: { nombre?: string; email?: string; edad?: number };
  fechaSalida?: string | null;
  fechaFin?: string | null;
  informacionTemporal?: {
    mes?: number;
    anio?: number;
    duracionDiasAproximada?: number;
    flexibilidadDias?: number | null;
  };
  presupuesto?: { monto?: number; moneda?: string; incluyeTransporte?: boolean };
  viajeros?: {
    cantidadTotal?: number;
    personas?: { edad?: number; tipo?: "adulto" | "menor" | "bebe" }[];
  };
  lugarSalida?: { ciudad?: string; provincia?: string; pais?: string };
  destino?: {
    lugaresPreferidos?: { ciudad?: string; provincia?: string; pais?: string; region?: string }[];
    destinosAbiertos?: boolean;
  };
  preferencias?: {
    clima?: string[];
    tipoViaje?: string[];
    intereses?: string[];
    ritmoViaje?: "tranquilo" | "equilibrado" | "intenso" | null;
    vidaNocturna?: NivelPreferencia;
    naturaleza?: NivelPreferencia;
    gastronomia?: NivelPreferencia;
    cultura?: NivelPreferencia;
    socializar?: "noImporta" | "meGustaria" | "prioridad";
  };
  transporte?: {
    vuelo?: {
      clase?: "economica" | "premiumEconomy" | "business" | "primeraClase" | null;
      escalas?: "sinEscalas" | "maxUna" | "indiferente" | null;
    };
  };
  restricciones?: {
    destinosExcluidos?: string[];
    transportesExcluidos?: string[];
    actividadesExcluidas?: string[];
    restriccionesAlimentarias?: string[];
    necesidadesMovilidad?: string[];
  };
}

export interface ChatRespuesta {
  mensaje: string;
  estado: EstadoPerfil;
  viaje: PerfilViaje | null;
  preguntas: PreguntaPerfil[];
  /** Nombres de campo que el backend marca como prioritarios entre los faltantes. Sin UI propia todavía. */
  camposFaltantesImportantes?: string[];
}
