// src/modules/auth/context/AuthContext.tsx

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useAuth } from "@clerk/react";
import axios from "axios";

import type { AuthUserResponse } from "./auth.types";
import { authService } from "./auth.service";

type AuthContextValue = {
  user: AuthUserResponse | null;
  isLoading: boolean;
  /**
   * Motivo de por qué GET /api/me falló con una sesión de Clerk activa
   * (isSignedIn=true). Antes esto solo se logueaba por console.error y se
   * tragaba silenciosamente (user=null) — indistinguible de "todavía no
   * logueado", lo que hacía que RequireSession mandara de vuelta a
   * /login-viajes, donde <SignIn/> detecta la sesión de Clerk activa y
   * redirige de nuevo a /chat: loop infinito sin ningún mensaje visible.
   * Con este campo, RequireSession puede distinguir "no logueado" de
   * "logueado pero algo del lado de la app falló" y mostrar el error en vez
   * de rebotar.
   */
  error: string | null;
  refreshUser: () => Promise<void>;
  logoutLocalUser: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { isLoaded, isSignedIn } = useAuth();

  const [user, setUser] = useState<AuthUserResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function refreshUser() {
    if (!isLoaded || !isSignedIn) {
      setUser(null);
      setError(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const authUser = await authService.getAuth();
      setUser(authUser);
      setError(null);
    } catch (err) {
      const detalle = axios.isAxiosError(err)
        ? `GET /api/me → ${err.response?.status ?? "sin respuesta del gateway"} ${JSON.stringify(err.response?.data ?? err.message)}`
        : String(err);
      console.error("Error obteniendo usuario autenticado:", detalle);
      setUser(null);
      setError(detalle);
    } finally {
      setIsLoading(false);
    }
  }

  function logoutLocalUser() {
    setUser(null);
    setError(null);
  }

  useEffect(() => {
    refreshUser();
  }, [isLoaded, isSignedIn]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        error,
        refreshUser,
        logoutLocalUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthUser() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuthUser debe usarse dentro de AuthProvider");
  }

  return context;
}