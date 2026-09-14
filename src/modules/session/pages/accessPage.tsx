import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { SignIn } from "@clerk/react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { APP_ROUTES } from "@/config/app.routes";
import { Logo } from "@/components/brand/Logo";
import { useTheme } from "@/lib/useTheme";

import { useAppAuth } from "../useAppAuth";

/**
 * Único punto de entrada para loguearse. La rama que se muestra depende de
 * useAppAuth().mode (ver session.config.ts):
 *   - "clerk" (default, con Publishable Key real puesta): muestra el
 *     <SignIn/> de Clerk. La instancia de FreeVago solo tiene Google
 *     habilitado como método social — confirmado contra la API de Clerk,
 *     no asumido — así que el widget de Clerk ya sale mostrando solo eso,
 *     sin que haga falta restringirlo a mano acá.
 *   - "local" (VITE_AUTH_MODE=local, válvula de emergencia si el gateway
 *     se cae): mantiene el form propio de siempre, contra /users de MS1.
 * RequireSession (el gate de las rutas protegidas) lee el mismo
 * useAppAuth().user sin importar cuál rama generó la sesión.
 */
export default function AccessPage() {
  const navigate = useNavigate();
  const { mode, loginLocal } = useAppAuth();
  const { theme } = useTheme();

  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await loginLocal({ nombre, email });
      navigate(APP_ROUTES.chat.root, { replace: true });
    } catch {
      setError("No pudimos crear tu acceso. Probá de nuevo.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="fv-theme-transition flex min-h-screen items-center justify-center bg-background px-4 sm:px-6">
      <div className="w-full max-w-sm space-y-8 py-8">
        <div className="text-center">
          <div className="flex justify-center">
            <Logo withWordmark size={44} variant={theme === "dark" ? "onDark" : "default"} />
          </div>
          <p className="mt-3 text-muted-foreground">
            Contanos quién sos para empezar a armar tu viaje.
          </p>
        </div>

        {mode === "clerk" ? (
          <div className="flex justify-center">
            {/*
              "virtual" es un valor válido en runtime (Clerk lo soporta y ya
              lo probamos andando) y está en el tipo RoutingStrategy real de
              @clerk/shared ('path'|'hash'|'virtual'), pero `tsc -b` (a
              diferencia de `tsc --noEmit`, que no se queja) resuelve las
              declaraciones duplicadas CJS/ESM de ese paquete hacia una
              variante vieja de SignInProps que no lo incluye — problema de
              los .d.ts del paquete, no de este código.
            */}
            <SignIn
              // @ts-expect-error -- ver comentario arriba: "virtual" es válido en runtime, el tipo de esta versión de @clerk/react no lo refleja
              routing="virtual"
              fallbackRedirectUrl={APP_ROUTES.chat.root}
            />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="nombre">Nombre</Label>
              <Input
                id="nombre"
                className="h-11"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                required
                autoFocus
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                className="h-11"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button type="submit" className="h-11 w-full" disabled={isSubmitting}>
              {isSubmitting ? "Ingresando..." : "Empezar a planificar"}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
