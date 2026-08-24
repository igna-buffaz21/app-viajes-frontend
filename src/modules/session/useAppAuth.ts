import { useEffect, useState } from "react";

import { useAuthUser } from "@/modules/auth/auth.context";

import { getAuthMode, type AuthMode } from "./session.config";
import { clearUser, getStoredUser, loginLocal as loginLocalRequest } from "./session.local";
import type { LocalUser } from "./session.types";

interface UseAppAuthResult {
  user: LocalUser | null;
  isLoading: boolean;
  mode: AuthMode;
  loginLocal: (input: { nombre: string; email: string }) => Promise<void>;
  logout: () => void;
}

/**
 * Punto único de acceso a la identidad del usuario para todo lo nuevo de
 * FreeVago (chat, resultados). Decide internamente si usar Clerk (rama
 * "clerk", hoy inactiva) o el login local (rama "local", activa por default
 * — ver session.config.ts). Los consumidores nunca necesitan saber cuál está
 * activa.
 */
export function useAppAuth(): UseAppAuthResult {
  const mode = getAuthMode();

  // Se llama siempre, sin importar el modo: las reglas de hooks no permiten
  // invocarlo condicionalmente, y no tiene costo mientras el modo sea "local"
  // (su propio efecto interno no llama a /auth/me si Clerk no tiene sesión).
  const clerkAuth = useAuthUser();

  const [localUser, setLocalUser] = useState<LocalUser | null>(() => getStoredUser());
  const [isLocalLoading, setIsLocalLoading] = useState(false);

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
    if (mode === "clerk") {
      clerkAuth.logoutLocalUser();
      return;
    }

    clearUser();
    setLocalUser(null);
  }

  if (mode === "clerk") {
    return {
      user: clerkAuth.user
        ? {
            usuarioId: clerkAuth.user.id,
            nombre: clerkAuth.user.name,
            email: clerkAuth.user.email,
          }
        : null,
      isLoading: clerkAuth.isLoading,
      mode,
      loginLocal: loginLocalHandler,
      logout,
    };
  }

  return {
    user: localUser,
    isLoading: isLocalLoading,
    mode,
    loginLocal: loginLocalHandler,
    logout,
  };
}
