import { useMemo, useState, type ReactNode } from "react";
import { signIn } from "./auth-api";
import { AuthContext, type AuthContextValue } from "./auth-context";
import type { AdminUser } from "./types";
import { clearTokens, getAccessToken } from "../../lib/api-client";

const storageKey = "emma-admin-user";

function readStoredUser(): AdminUser | null {
  try {
    if (!getAccessToken()) return null;
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
        // The API may return a user object. Fall back to the login email so the
        // existing admin shell can render while only token fields are returned.
        const user: AdminUser = {
          id: response.user?.id ?? credentials.email,
          email: response.user?.email ?? credentials.email,
          name: response.user?.name ?? credentials.email.split("@")[0],
          role: response.user?.role ?? "admin",
        };
        setUser(user);
        window.sessionStorage.setItem(storageKey, JSON.stringify(user));
      },
      signOut: () => {
        setUser(null);
        window.sessionStorage.removeItem(storageKey);
        clearTokens();
      },
    }),
    [user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
