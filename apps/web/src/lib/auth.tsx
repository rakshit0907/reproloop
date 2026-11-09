"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { apiFetch, type PublicUser } from "./api";

const TOKEN_KEY = "reproloop.token";

interface RegisterInput {
  name: string;
  email: string;
  password: string;
  role: "REPORTER" | "DEVELOPER";
}

interface AuthState {
  user: PublicUser | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<PublicUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function restore() {
      const saved = localStorage.getItem(TOKEN_KEY);
      if (saved) {
        try {
          setUser(await apiFetch<PublicUser>("/auth/me", { token: saved }));
          setToken(saved);
        } catch {
          localStorage.removeItem(TOKEN_KEY);
        }
      }
      setLoading(false);
    }
    void restore();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const result = await apiFetch<{ accessToken: string; user: PublicUser }>("/auth/login", {
      body: { email, password },
    });
    localStorage.setItem(TOKEN_KEY, result.accessToken);
    setToken(result.accessToken);
    setUser(result.user);
  }, []);

  const register = useCallback(
    async (input: RegisterInput) => {
      await apiFetch<PublicUser>("/auth/register", { body: input });
      await login(input.email, input.password);
    },
    [login],
  );

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, token, loading, login, register, logout }),
    [user, token, loading, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return context;
}