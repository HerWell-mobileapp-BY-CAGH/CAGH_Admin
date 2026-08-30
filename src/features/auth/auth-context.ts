import { createContext, useContext } from "react";
import type { AdminUser, SignInCredentials } from "./types";

export type AuthContextValue = {
  user: AdminUser | null;
  signIn: (credentials: SignInCredentials) => Promise<void>;
  signOut: () => void;
};

export const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}
