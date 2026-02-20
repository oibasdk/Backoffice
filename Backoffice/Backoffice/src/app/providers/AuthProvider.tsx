import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
};

export type AuthUser = {
  email: string;
  role: string;
};

type StoredAuth = {
  tokens: AuthTokens;
  user?: AuthUser | null;
};

type AuthContextValue = {
  tokens: AuthTokens | null;
  user: AuthUser | null;
  setAuth: (tokens: AuthTokens, user: AuthUser | null) => void;
  updateTokens: (tokens: AuthTokens) => void;
  clearAuth: () => void;
  isAuthenticated: boolean;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);
const STORAGE_KEY = "backoffice.auth";
const PERSIST_TOKENS = import.meta.env.VITE_BACKOFFICE_PERSIST_TOKENS === "true";

const readStoredAuth = (): { tokens: AuthTokens | null; user: AuthUser | null } => {
  if (!PERSIST_TOKENS || typeof window === "undefined" || !window.sessionStorage) {
    return { tokens: null, user: null };
  }
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return { tokens: null, user: null };
    }
    const parsed = JSON.parse(raw) as StoredAuth;
    if (!parsed?.tokens?.accessToken || !parsed?.tokens?.refreshToken) {
      return { tokens: null, user: null };
    }
    return { tokens: parsed.tokens, user: parsed.user ?? null };
  } catch {
    return { tokens: null, user: null };
  }
};

const persistAuth = (tokens: AuthTokens | null, user: AuthUser | null) => {
  if (!PERSIST_TOKENS || typeof window === "undefined" || !window.sessionStorage) {
    return;
  }
  try {
    if (!tokens) {
      window.sessionStorage.removeItem(STORAGE_KEY);
      return;
    }
    const payload: StoredAuth = { tokens, user };
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    return;
  }
};

export const AuthProvider: React.FC<{ children: React.ReactNode; initialTokens?: AuthTokens | null }> = ({
  children,
  initialTokens = null,
}) => {
  const stored = useMemo(() => readStoredAuth(), []);
  const [tokens, setTokens] = useState<AuthTokens | null>(initialTokens ?? stored.tokens);
  const [user, setUser] = useState<AuthUser | null>(stored.user);

  useEffect(() => {
    if (import.meta.env.MODE === "production" || tokens) {
      return;
    }
    const bootstrap = window.__BACKOFFICE_TEST_AUTH__?.tokens;
    if (bootstrap?.accessToken && bootstrap?.refreshToken) {
      setTokens(bootstrap);
    }
  }, [tokens]);

  useEffect(() => {
    persistAuth(tokens, user);
  }, [tokens, user]);

  const setAuth = useCallback((nextTokens: AuthTokens, nextUser: AuthUser | null) => {
    setTokens(nextTokens);
    setUser(nextUser);
  }, []);

  const updateTokens = useCallback((nextTokens: AuthTokens) => {
    setTokens(nextTokens);
  }, []);

  const clearAuth = useCallback(() => {
    setTokens(null);
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      tokens,
      user,
      setAuth,
      updateTokens,
      clearAuth,
      isAuthenticated: Boolean(tokens?.accessToken),
    }),
    [tokens, user, setAuth, updateTokens, clearAuth]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};
