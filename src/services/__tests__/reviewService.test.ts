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
import { reviewService } from "../reviewService";

describe("reviewService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("cria avaliação usando FormData", async () => {
    const file = new File(["imagem"], "review.png", { type: "image/png" });
    vi.mocked(apiFetch).mockResolvedValueOnce({ id: 1 });

    await reviewService.create(10, 1, {
      rating: 5,
      comment: "Ótimo produto",
      images: [file],
    });

    expect(apiFetch).toHaveBeenCalledWith(
      "/orders/10/products/1/reviews",
      expect.objectContaining({
        method: "POST",
        body: expect.any(FormData),
      })
    );
  });

  it("busca avaliações por produto com filtros", async () => {
    vi.mocked(apiFetch).mockResolvedValueOnce([]);

    await reviewService.findByProductId(1, {
      rating: 5,
      withComment: true,
      withMedia: false,
    });

    expect(apiFetch).toHaveBeenCalledWith(
      "/products/1/reviews?rating=5&withComment=true&withMedia=false",
      {
        method: "GET",
        auth: false,
      }
    );
  });

  it("busca resumo, minhas avaliações e remove avaliação", async () => {
    vi.mocked(apiFetch).mockResolvedValue({});

    await reviewService.getSummaryByProductId(1);
    await reviewService.findMyReviews();
    await reviewService.delete(1);

    expect(apiFetch).toHaveBeenCalledWith("/products/1/reviews/summary", {
      method: "GET",
      auth: false,
    });
    expect(apiFetch).toHaveBeenCalledWith("/reviews/my", {
      method: "GET",
    });
    expect(apiFetch).toHaveBeenCalledWith("/reviews/1", {
      method: "DELETE",
    });
  });
});
