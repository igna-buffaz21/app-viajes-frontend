import { useEffect, useState } from "react";
import { Routes, Route } from "react-router-dom";
import { useAuth } from "@clerk/react";

import { ProtectedRoute } from "./lib/protectedRoute";

import LoginPage from "./modules/auth/pages/login";
import { setupApiInterceptors } from "./lib/interceptor";
import ShowUsers from "./modules/users/pages/showUsers.page";
import { APP_ROUTES } from "./config/app.routes";
import HomePage from "./modules/home/pages/Panelhome.page";
import PanelLayout from "./components/layout/panelLayout";
import { UnauthorizedPage } from "./modules/auth/pages/unauthorized.page";
import { InactiveAccountPage } from "./modules/auth/pages/inactiveAccount.page";

import { USER_ROLES } from "./config/const.globs";
import AppLayout from "./components/layout/appLayout";
import AppHomePage from "./modules/home/pages/appHome.page";

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
      <Route path="/" element={<LoginPage />} />

      <Route path={APP_ROUTES.auth.login} element={<LoginPage />} />

      <Route
        path={APP_ROUTES.auth.unauthorized}
        element={<UnauthorizedPage />}
      />

      <Route
        path={APP_ROUTES.auth.inactive}
        element={<InactiveAccountPage />}
      />

      {/* FreeVago: flujo nuevo, en paralelo al de arriba (municipal/Clerk) */}
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

      <Route
        path={APP_ROUTES.panel.root}
        element={
          <ProtectedRoute allowedRoles={[USER_ROLES.ADMIN, USER_ROLES.SUPERADMIN]}>
            <PanelLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<HomePage />} />

        <Route path={APP_ROUTES.panel.users} element={<ShowUsers />} />
      </Route>

      <Route
        path={APP_ROUTES.app.root}
        element={
          <ProtectedRoute allowedRoles={[USER_ROLES.CITIZEN]}>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<AppHomePage />} />
        
      </Route>
    </Routes>
  );
}

export default App;