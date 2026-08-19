import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";

import { APP_ROUTES } from "@/config/app.routes";

import { useAppAuth } from "./useAppAuth";

export function RequireSession({ children }: { children: ReactNode }) {
  const location = useLocation();
  const { user, isLoading } = useAppAuth();

  if (isLoading) {
    return <div>Cargando...</div>;
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
