import type {
  AuthenticatedUserResponse,
  LoginRequest,
  LoginResponse,
} from "@/types/auth";
import {
  apiFetch,
  clearAuthData,
  getRefreshToken,
  getStoredUser,
  saveAuthData,
} from "./api";

export const authService = {
  async login(request: LoginRequest): Promise<LoginResponse> {
    const response = await apiFetch<LoginResponse>("/auth/login", {
      method: "POST",
      body: request,
      auth: false,
    });

    saveAuthData(response);

    return response;
  },

  async refresh(): Promise<LoginResponse> {
    const refreshToken = getRefreshToken();

    if (!refreshToken) {
      throw new Error("Refresh token não encontrado");
    }

    const response = await apiFetch<LoginResponse>("/auth/refresh", {
      method: "POST",
      body: { refreshToken },
      auth: false,
      retry: false,
    });

    saveAuthData(response);

    return response;
  },

  async logout(): Promise<void> {
    const refreshToken = getRefreshToken();

    try {
      if (refreshToken) {
        await apiFetch<void>("/auth/logout", {
          method: "POST",
          body: { refreshToken },
          auth: false,
          retry: false,
        });
      }
    } finally {
      clearAuthData();
    }
  },

  async me(): Promise<AuthenticatedUserResponse> {
    return apiFetch<AuthenticatedUserResponse>("/auth/me", {
      method: "GET",
    });
  },

  getStoredUser(): AuthenticatedUserResponse | null {
    return getStoredUser();
  },

  clearSession(): void {
    clearAuthData();
  },
};