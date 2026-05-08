import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  AUTH_USER_KEY,
  REFRESH_TOKEN_KEY,
  TOKEN_EXPIRES_IN_KEY,
  TOKEN_KEY,
  TOKEN_TYPE_KEY,
  ApiRequestError,
  apiFetch,
  buildApiUrl,
  buildPublicFileUrl,
  buildQueryParams,
  clearAuthData,
  getAccessToken,
  getRefreshToken,
  getStoredUser,
  saveAuthData,
} from "../api";
import { authenticatedCustomerFixture } from "@/test/fixtures/userFixture";

describe("api", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  it("monta URL da API", () => {
    expect(buildApiUrl("/products")).toBe("http://localhost:8080/products");
    expect(buildApiUrl("products")).toBe("http://localhost:8080/products");
    expect(buildApiUrl("https://api.exemplo.com/products")).toBe(
      "https://api.exemplo.com/products"
    );
  });

  it("monta URL pública de arquivo", () => {
    expect(buildPublicFileUrl("/uploads/image.png")).toBe(
      "http://localhost:8080/uploads/image.png"
    );
    expect(buildPublicFileUrl("https://cdn.exemplo.com/image.png")).toBe(
      "https://cdn.exemplo.com/image.png"
    );
    expect(buildPublicFileUrl(null)).toBeNull();
  });

  it("monta query params ignorando valores vazios", () => {
    expect(
      buildQueryParams({
        search: "notebook",
        empty: "",
        nullish: null,
        available: true,
      })
    ).toBe("?search=notebook&available=true");
  });

  it("salva, recupera e limpa dados de autenticação", () => {
    saveAuthData({
      token: "access-token",
      refreshToken: "refresh-token",
      type: "Bearer",
      expiresIn: 3600,
      user: authenticatedCustomerFixture,
    });

    expect(getAccessToken()).toBe("access-token");
    expect(getRefreshToken()).toBe("refresh-token");
    expect(localStorage.getItem(TOKEN_TYPE_KEY)).toBe("Bearer");
    expect(localStorage.getItem(TOKEN_EXPIRES_IN_KEY)).toBe("3600");
    expect(getStoredUser()).toEqual(authenticatedCustomerFixture);

    clearAuthData();

    expect(localStorage.getItem(TOKEN_KEY)).toBeNull();
    expect(localStorage.getItem(REFRESH_TOKEN_KEY)).toBeNull();
    expect(localStorage.getItem(AUTH_USER_KEY)).toBeNull();
  });

  it("realiza requisição GET com resposta JSON", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    );

    await expect(apiFetch<{ ok: boolean }>("/health")).resolves.toEqual({
      ok: true,
    });

    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:8080/health",
      expect.objectContaining({
        headers: expect.any(Headers),
      })
    );
  });

  it("envia body JSON quando body é objeto", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ id: 1 }), {
        status: 201,
        headers: { "Content-Type": "application/json" },
      })
    );

    await apiFetch("/users", {
      method: "POST",
      body: { fullName: "Cliente" },
      auth: false,
    });

    const [, options] = vi.mocked(fetch).mock.calls[0];

    expect(options).toEqual(
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ fullName: "Cliente" }),
      })
    );
  });

  it("retorna undefined para resposta 204", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(new Response(null, { status: 204 }));

    await expect(apiFetch<void>("/notifications/read-all")).resolves.toBeUndefined();
  });

  it("lança ApiRequestError para resposta de erro", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          status: 400,
          title: "Erro de validação",
          detail: "Campo obrigatório",
          instance: "/users",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      )
    );

    await expect(apiFetch("/users", { auth: false })).rejects.toBeInstanceOf(
      ApiRequestError
    );
  });

  it("adiciona Authorization quando existe token", async () => {
    localStorage.setItem(TOKEN_KEY, "access-token");

    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    );

    await apiFetch("/users/me");

    const [, options] = vi.mocked(fetch).mock.calls[0];
    const headers = options?.headers as Headers;

    expect(headers.get("Authorization")).toBe("Bearer access-token");
  });
});
