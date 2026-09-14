import { LogOut } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";

interface AccountFooterProps {
  nombre: string;
  onLogout: () => void;
}

/**
 * Sección de cuenta fija al pie del panel de historial — mismo componente
 * reusado en el Sheet de mobile y el panel persistente de desktop (ver
 * chat.page.tsx), para no duplicar la implementación. Antes el toggle de
 * tema y "Salir" vivían sueltos en el header principal; se movieron acá,
 * mismo criterio que el historial de esta interfaz de Claude (la cuenta
 * vive debajo del historial, no en el header).
 */
export function AccountFooter({ nombre, onLogout }: AccountFooterProps) {
  return (
    <div className="mt-auto flex items-center justify-between gap-2 border-t border-border pt-3">
      <span className="min-w-0 truncate text-sm font-medium text-foreground">{nombre}</span>
      <div className="flex flex-none items-center gap-1.5">
        <ThemeToggle />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onLogout}
          // Acento del sistema (mismo #E8955C en claro y oscuro, ver
          // index.css) en vez de gris — "Cerrar sesión" tiene que
          // destacarse como una acción importante, no leerse como una
          // opción más entre otras.
          className="gap-1.5 border-accent text-accent hover:bg-accent-soft hover:text-accent"
        >
          <LogOut className="size-3.5" />
          Cerrar sesión
        </Button>
      </div>
    </div>
  );
}
