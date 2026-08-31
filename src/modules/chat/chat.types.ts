export type ChatRole = "usuario" | "asistente";

export interface ChatMessage {
  role: ChatRole;
  contenido: string;
}

export type TipoPregunta = "siNo" | "opciones" | "texto";

export interface PreguntaPerfil {
  campo: string;
  pregunta: string;
  motivo: string;
  tipoPregunta: TipoPregunta;
  /** Solo presente cuando tipoPregunta es "opciones": alternativas para armar la encuesta. */
  opciones?: string[];
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
    // CONFIRMADO en runtime (2026-08-31, POST /api/conversaciones/mensaje real):
    // llega como array de strings (ej. ["Miami"]), no de objetos — distinto
    // de lo que documentaba AUDITORIA_BACKEND.md sección 2bis a partir de
    // leer el modelo en la rama origin/Alejo (puede haber cambiado desde
    // entonces, o ser una simplificación del lado de la IA al armar el JSON).
    lugaresPreferidos?: string[];
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

/** Estado del registro de conversación en Mongo (distinto de EstadoPerfil, que es el estado del perfil que arma la IA en cada turno). */
export type EstadoConversacion = "en_progreso" | "completo";

/** Resumen liviano de una conversación, para listarlas y poder cambiar entre ellas (GET /api/conversaciones). */
export interface ConversacionResumen {
  conversacionId: string;
  estado: EstadoConversacion;
  titulo: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChatRespuesta {
  mensaje: string;
  estado: EstadoPerfil;
  viaje: PerfilViaje | null;
  preguntas: PreguntaPerfil[];
  /** Nombres de campo que el backend marca como prioritarios entre los faltantes. Sin UI propia todavía. */
  camposFaltantesImportantes?: string[];
  /** Id de la conversación en el backend (POST /api/conversaciones/mensaje). Ausente en modo mock. */
  conversacionId?: string;
}
