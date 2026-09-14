// src/modules/session/clerkMongoBridge.ts
//
// MS1 todavía no adoptó Clerk del lado de ellos (gateway en "Opción B", ver
// TP-Grupo-1-Clerk-Gateway/Back/src/app.js): POST /api/survey valida
// `usuarioId` como ObjectId de Mongo (24 hex) y rechaza con 400
// "usuarioId inválido" cualquier otra cosa — confirmado con curl real,
// mandando el id de Clerk (formato "user_xxx") tal cual.
//
// Este módulo crea, una sola vez por usuario de Clerk, un usuario espejo en
// la colección `usuarios` de MS1 (vía POST /api/users, la misma ruta que ya
// usa el login local en session.local.ts) y cachea el _id real de Mongo en
// localStorage para no crear uno nuevo en cada sesión. Ese _id es lo que se
// usa como `usuarioId` al hablar con MS1 — el token de Clerk sigue viajando
// igual en el header Authorization (lo pone el interceptor), listo para el
// día que MS1 empiece a leer el userId de Clerk desde x-user-id (Opción A).
// Ese día, este archivo se puede borrar sin tocar nada más de session/.
import { api } from "@/lib/axios";
import { API_ROUTES } from "@/config/api.routes";

const STORAGE_PREFIX = "freevago.session.clerkMongoMap.";

interface UsuarioBackend {
  _id: string;
  nombre: string;
  email: string;
}

export function getUsuarioEspejoCacheado(clerkUserId: string): string | null {
  try {
    return localStorage.getItem(STORAGE_PREFIX + clerkUserId);
  } catch {
    // localStorage puede fallar (modo privado, cuota) — no es fatal, en el
    // peor caso se crea un usuario espejo nuevo en la próxima sesión.
    return null;
  }
}

function guardarUsuarioEspejo(clerkUserId: string, mongoUsuarioId: string): void {
  try {
    localStorage.setItem(STORAGE_PREFIX + clerkUserId, mongoUsuarioId);
  } catch {
    // ver comentario arriba — no rompe el flujo si falla.
  }
}

// Dedupe de creaciones en vuelo: si useAppAuth se llama desde varios
// consumidores mientras la primera creación todavía no resolvió, todos
// esperan la misma promesa en vez de disparar varios POST /users.
const creacionesEnVuelo = new Map<string, Promise<string>>();

export async function obtenerOCrearUsuarioEspejo(clerkUser: {
  userId: string;
  email: string | null;
  nombre: string;
}): Promise<string> {
  const cacheado = getUsuarioEspejoCacheado(clerkUser.userId);
  if (cacheado) {
    return cacheado;
  }

  const enVuelo = creacionesEnVuelo.get(clerkUser.userId);
  if (enVuelo) {
    return enVuelo;
  }

  const promesa = (async () => {
    const response = await api.post<UsuarioBackend>(API_ROUTES.users.create, {
      nombre: clerkUser.nombre,
      // MS1 no tiene "buscar por clerkUserId" — el email real de Clerk hace
      // de identidad del usuario espejo. Si Clerk no tiene un email público
      // (ej. login solo con teléfono en otro provider), se usa un
      // placeholder único por clerkUserId para no romper la creación.
      email: clerkUser.email ?? `${clerkUser.userId}@clerk.freevago.local`,
    });

    guardarUsuarioEspejo(clerkUser.userId, response.data._id);
    return response.data._id;
  })().finally(() => {
    creacionesEnVuelo.delete(clerkUser.userId);
  });

  creacionesEnVuelo.set(clerkUser.userId, promesa);
  return promesa;
}
