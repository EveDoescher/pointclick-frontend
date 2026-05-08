import { beforeEach, describe, expect, it, vi } from "vitest";
import { authenticatedCustomerFixture } from "@/test/fixtures/userFixture";

vi.mock("../api", () => ({
  apiFetch: vi.fn(),
  clearAuthData: vi.fn(),
  getRefreshToken: vi.fn(),
  getStoredUser: vi.fn(),
  saveAuthData: vi.fn(),
}));

import {
  apiFetch,
  clearAuthData,
  getRefreshToken,
  getStoredUser,
  saveAuthData,
} from "../api";
import { authService } from "../authService";

describe("authService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("realiza login e salva dados de autenticação", async () => {
    const response = {
      token: "token",
      refreshToken: "refresh",
      type: "Bearer",
      expiresIn: 3600,
      user: authenticatedCustomerFixture,
    };

    vi.mocked(apiFetch).mockResolvedValueOnce(response);

    await expect(
      authService.login({ email: "cliente@pointclick.com", password: "123456" })
    ).resolves.toEqual(response);

    expect(apiFetch).toHaveBeenCalledWith("/auth/login", {
      method: "POST",
      body: { email: "cliente@pointclick.com", password: "123456" },
      auth: false,
    });
    expect(saveAuthData).toHaveBeenCalledWith(response);
  });

  it("renova token usando refresh token salvo", async () => {
    vi.mocked(getRefreshToken).mockReturnValue("refresh-token");

    const response = {
      token: "new-token",
      refreshToken: "new-refresh",
      type: "Bearer",
      expiresIn: 3600,
      user: authenticatedCustomerFixture,
    };

    vi.mocked(apiFetch).mockResolvedValueOnce(response);

    await authService.refresh();

    expect(apiFetch).toHaveBeenCalledWith("/auth/refresh", {
      method: "POST",
      body: { refreshToken: "refresh-token" },
      auth: false,
      retry: false,
    });
    expect(saveAuthData).toHaveBeenCalledWith(response);
  });

  it("lança erro ao renovar sem refresh token", async () => {
    vi.mocked(getRefreshToken).mockReturnValue(null);

    await expect(authService.refresh()).rejects.toThrow(
      "Refresh token não encontrado"
    );
  });

  it("faz logout na API quando há refresh token e limpa sessão", async () => {
    vi.mocked(getRefreshToken).mockReturnValue("refresh-token");
    vi.mocked(apiFetch).mockResolvedValueOnce(undefined);

    await authService.logout();

    expect(apiFetch).toHaveBeenCalledWith("/auth/logout", {
      method: "POST",
      body: { refreshToken: "refresh-token" },
      auth: false,
      retry: false,
    });
    expect(clearAuthData).toHaveBeenCalled();
  });

  it("busca usuário autenticado", async () => {
    vi.mocked(apiFetch).mockResolvedValueOnce(authenticatedCustomerFixture);

    await authService.me();

    expect(apiFetch).toHaveBeenCalledWith("/auth/me", {
      method: "GET",
    });
  });

  it("expõe usuário salvo e limpeza de sessão", () => {
    vi.mocked(getStoredUser).mockReturnValue(authenticatedCustomerFixture);

    expect(authService.getStoredUser()).toEqual(authenticatedCustomerFixture);

    authService.clearSession();

    expect(clearAuthData).toHaveBeenCalled();
  });
});
