// Shape real de GET /api/me en TP-Grupo-1-Clerk-Gateway (Back/src/routes/me.js).
// El shape anterior (id/clerkId/name/role/status) era del scaffold municipal
// que compartía este repo — nunca coincidió con lo que devuelve el gateway
// de FreeVago, así que la rama "clerk" de useAppAuth nunca se probó contra
// datos reales hasta ahora.
export interface AuthUserResponse {
  userId: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  username: string | null;
  imageUrl: string;
  phone: string | null;
  address: {
    ciudad: string;
    provincia?: string;
    pais: string;
  } | null;
  createdAt: string | null;
}
