import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@clerk/react";

import { APP_ROUTES } from "@/config/app.routes";
import { useAuthUser } from "@/modules/auth/auth.context";

type ProtectedRouteProps = {
  children: ReactNode;
};

/**
 * Mecanismo genérico de auth-gating por sesión de Clerk (isSignedIn + cuenta
 * activa). El producto municipal que usaba esto con gating por rol
 * (allowedRoles) se eliminó junto con sus rutas — ninguna ruta usa este
 * componente hoy, se deja como mecanismo reutilizable para lo que venga.
 */
export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const location = useLocation();

  const { isLoaded, isSignedIn } = useAuth();
  const { user, isLoading } = useAuthUser();

  if (!isLoaded || isLoading) {
    return <div>Cargando...</div>;
  }

  if (!isSignedIn) {
    return (
      <Navigate
        to={APP_ROUTES.auth.login}
        replace
        state={{ from: location.pathname }}
      />
    );
  }

  if (!user) {
    return <Navigate to={APP_ROUTES.auth.login} replace />;
  }

  if (user.status !== "active") {
    return <Navigate to={APP_ROUTES.auth.inactive} replace />;
  }

  return <>{children}</>;
}