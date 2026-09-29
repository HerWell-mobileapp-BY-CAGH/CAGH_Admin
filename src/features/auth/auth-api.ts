import { apiClient, storeTokens } from "../../lib/api-client";
import type { SignInCredentials, SignInResponse } from "./types";

const loginPath = "/auth/admin/login/";

/** Authentication transport boundary backed by axios. */
export async function signIn(
  credentials: SignInCredentials,
): Promise<SignInResponse> {
  try {
    const response = await apiClient.post<SignInResponse>(loginPath, {
      email: credentials.email,
      password: credentials.password,
    });
    if (!response.data.access || !response.data.refresh) {
      throw new Error("The login response did not include authentication tokens.");
    }
    storeTokens(response.data.access, response.data.refresh);
    return response.data;
  } catch (error) {
    throw new Error("wrong password or username please try again", {
      cause: error,
    });
  }
}
