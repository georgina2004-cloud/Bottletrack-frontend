"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { User, LoginCredentials, LoginResponse } from "@/types/auth";
import {
  getStoredToken,
  setStoredToken,
  removeStoredToken,
  loginWithCredentials,
  logoutUser,
  getCurrentUser,
  getMisPermisos,
} from "@/lib/auth";

interface AuthContextType {
  user: User | null;
  token: string | null;
  permisos: string[];
  isLoading: boolean;
  login: (credentials: LoginCredentials, remember?: boolean) => Promise<LoginResponse>;
  logout: () => Promise<void>;
  setAuthData: (token: string, user: User, remember?: boolean) => void;
  updateUser: (updatedUser: User) => void;
  refrescarPermisos: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [permisos, setPermisos] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const router = useRouter();

  // Inicialización: sincronizar estado con la cookie bottletrack_token al montar
  useEffect(() => {
    async function initAuth() {
      const storedToken = getStoredToken();
      if (storedToken) {
        setToken(storedToken);
        try {
          // Valida el token con GET /api/user y obtiene permisos con GET /api/mis-permisos
          const [fetchedUser, fetchedPermisos] = await Promise.all([
            getCurrentUser(storedToken),
            getMisPermisos(storedToken),
          ]);
          setUser(fetchedUser);
          setPermisos(fetchedPermisos);
        } catch {
          // Si el token expiró o es inválido en Sanctum, eliminamos la cookie
          removeStoredToken();
          setToken(null);
          setUser(null);
          setPermisos([]);
        }
      }
      setIsLoading(false);
    }

    initAuth();
  }, []);

  /**
   * Iniciar sesión con email y contraseña
   * @param credentials { email, password }
   * @param remember Si es true, la cookie dura 30 días; si es false, dura la sesión actual
   */
  const login = useCallback(
    async (credentials: LoginCredentials, remember: boolean = false): Promise<LoginResponse> => {
      setIsLoading(true);
      try {
        const response = await loginWithCredentials(credentials);
        setStoredToken(response.token, remember);
        setToken(response.token);
        setUser(response.user);

        // Cargar permisos reales del usuario autenticado
        const userPermisos = await getMisPermisos(response.token);
        setPermisos(userPermisos);

        return response;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  /**
   * Refresca los permisos del usuario actual en memoria
   */
  const refrescarPermisos = useCallback(async () => {
    const currentToken = token || getStoredToken();
    if (currentToken) {
      const updatedPermisos = await getMisPermisos(currentToken);
      setPermisos(updatedPermisos);
    }
  }, [token]);

  /**
   * Asignar manualmente credenciales recibidas (ej. tras inicializar el setup)
   */
  const setAuthData = useCallback(
    (newToken: string, newUser: User, remember: boolean = true) => {
      setStoredToken(newToken, remember);
      setToken(newToken);
      setUser(newUser);
      getMisPermisos(newToken).then((p) => setPermisos(p));
    },
    []
  );

  /**
   * Actualizar los datos del usuario en sesión en memoria
   */
  const updateUser = useCallback((updatedUser: User) => {
    setUser(updatedUser);
  }, []);

  /**
   * Cerrar sesión: llama a Laravel para revocar el token, limpia la cookie y redirige a /login
   */
  const logout = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    const currentToken = token || getStoredToken();

    if (currentToken) {
      await logoutUser(currentToken);
    }

    removeStoredToken();
    setToken(null);
    setUser(null);
    setPermisos([]);
    setIsLoading(false);
    router.push("/login");
  }, [token, router]);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        permisos,
        isLoading,
        login,
        logout,
        setAuthData,
        updateUser,
        refrescarPermisos,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Hook para acceder al contexto de autenticación en cualquier parte de la aplicación
 */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth debe ser utilizado dentro de un AuthProvider");
  }
  return context;
}
