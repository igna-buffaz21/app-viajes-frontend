import { useEffect, useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "@clerk/react";

import { setupApiInterceptors } from "./lib/interceptor";
import { APP_ROUTES } from "./config/app.routes";
import { UnauthorizedPage } from "./modules/auth/pages/unauthorized.page";
import { InactiveAccountPage } from "./modules/auth/pages/inactiveAccount.page";

import AccessPage from "./modules/session/pages/accessPage";
import { RequireSession } from "./modules/session/RequireSession";
import ChatPage from "./modules/chat/pages/chat.page";
import ResultsPage from "./modules/results/pages/results.page";

function App() {
  const { getToken, isLoaded } = useAuth();
  const [isApiReady, setIsApiReady] = useState(false);

  useEffect(() => {
    if (!isLoaded) return;

    const cleanup = setupApiInterceptors(getToken);

    setIsApiReady(true);

    return cleanup;
  }, [isLoaded, getToken]);

  if (!isLoaded || !isApiReady) {
    return <div>Cargando...</div>;
  }

  return (
    <Routes>
      <Route path="/" element={<Navigate to={APP_ROUTES.auth.loginViajes} replace />} />

      {/* El producto municipal que compartía este repo (Clerk/panel/operator/app) se
          eliminó — esta ruta ya no tiene una página propia, así que redirige al único
          login funcional que queda. */}
      <Route
        path={APP_ROUTES.auth.login}
        element={<Navigate to={APP_ROUTES.auth.loginViajes} replace />}
      />

      <Route
        path={APP_ROUTES.auth.unauthorized}
        element={<UnauthorizedPage />}
      />

      <Route
        path={APP_ROUTES.auth.inactive}
        element={<InactiveAccountPage />}
      />

      <Route path={APP_ROUTES.auth.loginViajes} element={<AccessPage />} />

      <Route
        path={APP_ROUTES.chat.root}
        element={
          <RequireSession>
            <ChatPage />
          </RequireSession>
        }
      />

      <Route
        path={APP_ROUTES.resultados.root}
        element={
          <RequireSession>
            <ResultsPage />
          </RequireSession>
        }
      />
    </Routes>
  );
}

export default App;