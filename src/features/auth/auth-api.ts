import type { SignInCredentials, SignInResponse } from "./types";

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

/**
 * Authentication transport boundary. Configure VITE_API_BASE_URL to use the
 * real API; until then, local development uses a deliberately simple mock.
 */
export async function signIn(credentials: SignInCredentials): Promise<SignInResponse> {
  if (!apiBaseUrl) {
    await new Promise((resolve) => window.setTimeout(resolve, 350));
    return {
      user: {
        id: "local-admin",
        email: credentials.email,
        name: "Sarah Jenkins",
        role: "admin",
      },
    };
  }

  const response = await fetch(`${apiBaseUrl}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({
      email: credentials.email,
      password: credentials.password,
      remember: credentials.remember,
    }),
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as {
      message?: string;
    } | null;
    throw new Error(payload?.message ?? "Unable to sign in. Please try again.");
  }

  return (await response.json()) as SignInResponse;
}
