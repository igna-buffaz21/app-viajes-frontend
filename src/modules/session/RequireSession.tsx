import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@clerk/react";

import { APP_ROUTES } from "@/config/app.routes";
import { FullPageLoader } from "@/components/FullPageLoader";

import { useAppAuth } from "./useAppAuth";

export function RequireSession({ children }: { children: ReactNode }) {
  const location = useLocation();
  const { user, isLoading, error, mode, logout } = useAppAuth();

  // Solo se llama en modo "clerk" (mismo patrón que useAppAuth con
  // useAuthUser: el hook siempre se invoca, sin importar el modo, porque
  // las reglas de hooks no permiten condicionarlo).
  const clerkAuth = useAuth();

  if (isLoading) {
    return <FullPageLoader />;
  }

  // Bug real que causó un loop infinito (2026-09-13): con mode="clerk", si
  // Clerk tiene una sesión activa (isSignedIn=true) pero useAppAuth().user
  // no resolvió (GET /api/me falló, o el usuario espejo en MS1 falló), acá
  // abajo se navegaba a /login-viajes de todas formas — y ahí <SignIn/>
  // (ver accessPage.tsx) detecta la sesión de Clerk activa y redirige de
  // nuevo a /chat con fallbackRedirectUrl. Resultado: /chat → /login-viajes
  // → /chat → ... sin parar, sin ningún error visible (quedaba solo en
  // console.error). Esta rama corta el loop: si Clerk dice que hay sesión
  // pero nuestro propio estado falló, se muestra el error acá mismo, sin
  // navegar a ningún lado.
  if (mode === "clerk" && clerkAuth.isSignedIn && !user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
        <p className="font-medium text-destructive">
          Iniciaste sesión con Google, pero la app no pudo terminar de cargar tu cuenta.
        </p>
        {error && (
          <pre className="max-w-lg overflow-auto rounded bg-muted p-3 text-left text-xs text-muted-foreground">
            {error}
          </pre>
        )}
        <button
          type="button"
          className="text-sm underline"
          onClick={() => logout()}
        >
          Cerrar sesión y reintentar
        </button>
      </div>
    );
  }

  if (!user) {
    return (
      <Navigate
        to={APP_ROUTES.auth.loginViajes}
        replace
        state={{ from: location.pathname }}
      />
    );
  }

  return <>{children}</>;
}
