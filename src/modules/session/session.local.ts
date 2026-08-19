import { api } from "@/lib/axios";
import { API_ROUTES } from "@/config/api.routes";
import type { LocalUser } from "./session.types";

const STORAGE_KEY = "freevago.session.user";

interface UsuarioBackend {
  _id: string;
  nombre: string;
  email: string;
  edad?: number;
}

export function getStoredUser(): LocalUser | null {
  const raw = localStorage.getItem(STORAGE_KEY);

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as LocalUser;
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

function saveUser(user: LocalUser): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
}

export function clearUser(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export async function loginLocal(input: {
  nombre: string;
  email: string;
}): Promise<LocalUser> {
  const response = await api.post<UsuarioBackend>(API_ROUTES.users.create, input);

  const user: LocalUser = {
    usuarioId: response.data._id,
    nombre: response.data.nombre,
    email: response.data.email,
  };

  saveUser(user);

  return user;
}
