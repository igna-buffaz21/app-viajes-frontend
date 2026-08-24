import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { APP_ROUTES } from "@/config/app.routes";
import { Logo } from "@/components/brand/Logo";
import { useTheme } from "@/lib/useTheme";

import { useAppAuth } from "../useAppAuth";

export default function AccessPage() {
  const navigate = useNavigate();
  const { loginLocal } = useAppAuth();
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
      </div>
    </div>
  );
}
