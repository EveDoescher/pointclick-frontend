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
import { couponService } from "../couponService";

const request = {
  code: "POINT10",
  description: "Cupom teste",
  discountType: "PERCENTAGE" as const,
  discountValue: 10,
  minimumOrderValue: null,
  active: true,
  startsAt: null,
  endsAt: null,
  usageLimit: null,
};

describe("couponService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("cria cupom", async () => {
    vi.mocked(apiFetch).mockResolvedValueOnce({ id: 1 });

    await couponService.create(request);

    expect(apiFetch).toHaveBeenCalledWith("/coupons", {
      method: "POST",
      body: request,
    });
  });

  it("lista cupons com filtro ativo", async () => {
    vi.mocked(apiFetch).mockResolvedValueOnce([]);

    await couponService.findAll(true);

    expect(apiFetch).toHaveBeenCalledWith("/coupons?active=true", {
      method: "GET",
    });
  });

  it("busca, atualiza, ativa e desativa cupom", async () => {
    vi.mocked(apiFetch).mockResolvedValue({ id: 1 });

    await couponService.findById(1);
    await couponService.update(1, request);
    await couponService.deactivate(1);
    await couponService.activate(1);

    expect(apiFetch).toHaveBeenNthCalledWith(1, "/coupons/1", {
      method: "GET",
    });
    expect(apiFetch).toHaveBeenNthCalledWith(2, "/coupons/1", {
      method: "PUT",
      body: request,
    });
    expect(apiFetch).toHaveBeenNthCalledWith(3, "/coupons/1/deactivate", {
      method: "PATCH",
    });
    expect(apiFetch).toHaveBeenNthCalledWith(4, "/coupons/1/activate", {
      method: "PATCH",
    });
  });
});
