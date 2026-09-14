import { useEffect, useState } from "react";
import { useClerk } from "@clerk/react";
import axios from "axios";

import { useAuthUser } from "@/modules/auth/auth.context";
import { limpiarConversacionActiva } from "@/modules/chat/chat.storage";

import { getAuthMode, type AuthMode } from "./session.config";
import { clearUser, getStoredUser, loginLocal as loginLocalRequest } from "./session.local";
import { getUsuarioEspejoCacheado, obtenerOCrearUsuarioEspejo } from "./clerkMongoBridge";
import type { LocalUser } from "./session.types";

interface UseAppAuthResult {
  user: LocalUser | null;
  isLoading: boolean;
  mode: AuthMode;
  loginLocal: (input: { nombre: string; email: string }) => Promise<void>;
  logout: () => void;
  /**
   * Distinto de "no logueado": Clerk tiene una sesión activa pero algo del
   * lado de la app (GET /api/me o el usuario espejo de MS1) falló. Cuando
   * esto está seteado, RequireSession NO debe navegar a /login-viajes —
   * <SignIn/> ahí detectaría la sesión de Clerk activa y rebotaría de vuelta
   * a /chat, produciendo un loop infinito sin ningún mensaje visible (así
   * se manifestó originalmente este bug).
   */
  error: string | null;
}

/** Nombre para mostrar / para el usuario espejo de MS1, a partir del perfil de Clerk. */
function nombreDesdeClerkUser(clerkUser: { firstName: string | null; lastName: string | null; username: string | null; email: string | null }): string {
  return (
    [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") ||
    clerkUser.username ||
    clerkUser.email ||
    "Usuario FreeVago"
  );
}

/**
 * Punto único de acceso a la identidad del usuario para todo lo nuevo de
 * FreeVago (chat, resultados). Decide internamente si usar Clerk (rama
 * "clerk", activa por default desde que tenemos Publishable Key real — ver
 * session.config.ts) o el login local (rama "local", disponible como
 * fallback de emergencia con VITE_AUTH_MODE=local si el gateway se cae).
 * Los consumidores nunca necesitan saber cuál está activa.
 */
export function useAppAuth(): UseAppAuthResult {
  const mode = getAuthMode();

  // Se llama siempre, sin importar el modo: las reglas de hooks no permiten
  // invocarlo condicionalmente, y no tiene costo mientras el modo sea "local"
  // (su propio efecto interno no llama a /api/me si Clerk no tiene sesión).
  const clerkAuth = useAuthUser();
  const { signOut } = useClerk();

  const [localUser, setLocalUser] = useState<LocalUser | null>(() => getStoredUser());
  const [isLocalLoading, setIsLocalLoading] = useState(false);

  // Ver clerkMongoBridge.ts: MS1 sigue en "Opción B" (sin Clerk todavía) y
  // valida `usuarioId` como ObjectId de Mongo — el id de Clerk ("user_xxx")
  // no pasa esa validación. Mientras eso no cambie del otro lado, hace falta
  // este usuario espejo para poder hablar con /api/survey en modo "clerk".
  const [mongoUsuarioId, setMongoUsuarioId] = useState<string | null>(() =>
    clerkAuth.user ? getUsuarioEspejoCacheado(clerkAuth.user.userId) : null
  );
  const [isBridging, setIsBridging] = useState(false);
  const [bridgeError, setBridgeError] = useState<string | null>(null);

  useEffect(() => {
    if (mode !== "clerk" || !clerkAuth.user) {
      setMongoUsuarioId(null);
      return;
    }

    const cacheado = getUsuarioEspejoCacheado(clerkAuth.user.userId);
    if (cacheado) {
      setMongoUsuarioId(cacheado);
      setBridgeError(null);
      return;
    }

    let cancelado = false;
    setIsBridging(true);
    setBridgeError(null);

    obtenerOCrearUsuarioEspejo({
      userId: clerkAuth.user.userId,
      email: clerkAuth.user.email,
      nombre: nombreDesdeClerkUser(clerkAuth.user),
    })
      .then((mongoId) => {
        if (!cancelado) setMongoUsuarioId(mongoId);
      })
      .catch((err) => {
        const detalle = axios.isAxiosError(err)
          ? `POST /api/users → ${err.response?.status ?? "sin respuesta del gateway"} ${JSON.stringify(err.response?.data ?? err.message)}`
          : String(err);
        console.error(
          "No se pudo crear el usuario espejo en MS1 para este usuario de Clerk:",
          detalle
        );
        if (!cancelado) setBridgeError(detalle);
      })
      .finally(() => {
        if (!cancelado) setIsBridging(false);
      });

    return () => {
      cancelado = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    mode,
    clerkAuth.user?.userId,
    clerkAuth.user?.email,
    clerkAuth.user?.firstName,
    clerkAuth.user?.lastName,
    clerkAuth.user?.username,
  ]);

  useEffect(() => {
    if (mode !== "local") return;
    setLocalUser(getStoredUser());
  }, [mode]);

  async function loginLocalHandler(input: { nombre: string; email: string }) {
    setIsLocalLoading(true);
    try {
      const user = await loginLocalRequest(input);
      setLocalUser(user);
    } finally {
      setIsLocalLoading(false);
    }
  }

  function logout() {
    // Corta la conversación "activa" guardada de esta sesión (ver
    // chat.storage.ts) — sessionStorage ya no la retoma si se cierra la
    // pestaña, pero un logout+login de nuevo SIN cerrarla sí la seguiría
    // viendo si no se limpia acá. Esto es lo que hace que "cada login
    // arranca en un chat nuevo" sea cierto también en ese caso.
    if (mode === "clerk" && mongoUsuarioId) {
      limpiarConversacionActiva(mongoUsuarioId);
    } else if (mode === "local" && localUser?.usuarioId) {
      limpiarConversacionActiva(localUser.usuarioId);
    }

    if (mode === "clerk") {
      // Cierra la sesión real de Clerk (si no, al recargar la página el
      // usuario vuelve a aparecer logueado) y limpia el estado local del
      // contexto. El mapeo clerkUserId → usuarioId de Mongo en localStorage
      // se deja — es reutilizable si vuelve a loguearse con la misma cuenta.
      void signOut();
      clerkAuth.logoutLocalUser();
      return;
    }

    clearUser();
    setLocalUser(null);
  }

  if (mode === "clerk") {
    return {
      user:
        clerkAuth.user && mongoUsuarioId
          ? {
              // usuarioId es el _id de Mongo del usuario espejo (ver arriba),
              // NO el id de Clerk — ese es el que entiende MS1 hoy.
              usuarioId: mongoUsuarioId,
              nombre: nombreDesdeClerkUser(clerkAuth.user),
              email: clerkAuth.user.email ?? "",
            }
          : null,
      // Mientras el usuario espejo no resolvió, tratamos la sesión como
      // "cargando" — evita que algún consumidor use un usuarioId a medio
      // resolver.
      isLoading: clerkAuth.isLoading || isBridging,
      mode,
      loginLocal: loginLocalHandler,
      logout,
      error: clerkAuth.error ?? bridgeError,
    };
  }

  return {
    user: localUser,
    isLoading: isLocalLoading,
    mode,
    loginLocal: loginLocalHandler,
    logout,
    error: null,
  };
}
