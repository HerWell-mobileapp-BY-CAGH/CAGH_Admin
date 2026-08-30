import { useMemo, useState, type ReactNode } from "react";
import { signIn } from "./auth-api";
import { AuthContext, type AuthContextValue } from "./auth-context";
import type { AdminUser } from "./types";

const storageKey = "emma-admin-user";

function readStoredUser(): AdminUser | null {
  try {
    const value = window.sessionStorage.getItem(storageKey);
    return value ? (JSON.parse(value) as AdminUser) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(readStoredUser);
  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      signIn: async (credentials) => {
        const response = await signIn(credentials);
        setUser(response.user);
        window.sessionStorage.setItem(storageKey, JSON.stringify(response.user));
      },
      signOut: () => {
        setUser(null);
        window.sessionStorage.removeItem(storageKey);
      },
    }),
    [user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
