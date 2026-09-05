import axios, { type InternalAxiosRequestConfig } from "axios";

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000/api/v1";

export const accessTokenKey = "access_token";
export const refreshTokenKey = "refresh_token";

export function getAccessToken() {
  return window.localStorage.getItem(accessTokenKey);
}

export function storeTokens(access: string, refresh: string) {
  window.localStorage.setItem(accessTokenKey, access);
  window.localStorage.setItem(refreshTokenKey, refresh);
}

export function clearTokens() {
  window.localStorage.removeItem(accessTokenKey);
  window.localStorage.removeItem(refreshTokenKey);
}

// Refreshing is deliberately kept in the shared Axios client so every protected
// admin request (dashboard and review actions) recovers from one expired token.
async function refreshAccessToken() {
  const refresh = window.localStorage.getItem(refreshTokenKey);
  if (!refresh) return null;
  const response = await axios.post<{ access: string }>(`${apiBaseUrl}/auth/token/refresh/`, { refresh });
  window.localStorage.setItem(accessTokenKey, response.data.access);
  return response.data.access;
}

/** Shared axios instance for all backend requests. */
export const apiClient = axios.create({
  baseURL: apiBaseUrl,
  headers: { "Content-Type": "application/json" },
});

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getAccessToken();
  if (token && !config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const request = error.config as (InternalAxiosRequestConfig & { _retried?: boolean }) | undefined;
    if (error.response?.status !== 401 || !request || request._retried) {
      return Promise.reject(error);
    }
    request._retried = true;
    try {
      const access = await refreshAccessToken();
      if (!access) throw error;
      request.headers.Authorization = `Bearer ${access}`;
      return apiClient(request);
    } catch {
      clearTokens();
      return Promise.reject(error);
    }
  },
);

export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const message = (error.response?.data as { message?: string } | undefined)
      ?.message;
    return message ?? error.message ?? fallback;
  }
  return error instanceof Error ? error.message : fallback;
}
