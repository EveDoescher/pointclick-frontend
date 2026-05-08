import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../api", () => ({
  apiFetch: vi.fn(),
  buildQueryParams: vi.fn((params: Record<string, unknown>) => {
    const searchParams = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
      if (value === undefined || value === null || value === "") return;
      searchParams.append(key, String(value));
    });

    const query = searchParams.toString();
    return query ? `?${query}` : "";
  }),
}));


import { apiFetch } from "../api";
import { favoriteService } from "../favoriteService";

describe("favoriteService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("lista favoritos", async () => {
    vi.mocked(apiFetch).mockResolvedValueOnce([]);

    await favoriteService.findMyFavorites();

    expect(apiFetch).toHaveBeenCalledWith("/favorites", {
      method: "GET",
    });
  });

  it("adiciona e remove favorito", async () => {
    vi.mocked(apiFetch).mockResolvedValue({});

    await favoriteService.addFavorite(1);
    await favoriteService.removeFavorite(1);

    expect(apiFetch).toHaveBeenNthCalledWith(1, "/favorites/products/1", {
      method: "POST",
    });
    expect(apiFetch).toHaveBeenNthCalledWith(2, "/favorites/products/1", {
      method: "DELETE",
    });
  });

  it("verifica se produto é favorito do usuário atual", async () => {
    vi.mocked(apiFetch).mockResolvedValueOnce({ favorited: true });

    await expect(favoriteService.existsForCurrentUser(1)).resolves.toBe(true);

    expect(apiFetch).toHaveBeenCalledWith("/favorites/products/1/exists", {
      method: "GET",
    });
  });
});
