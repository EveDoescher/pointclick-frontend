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
import { addressService } from "../addressService";

describe("addressService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("busca endereço por CEP normalizado", async () => {
    vi.mocked(apiFetch).mockResolvedValueOnce({
      cep: "13480000",
      street: "Rua Teste",
      district: "Centro",
      city: "Limeira",
      state: "SP",
    });

    await addressService.findAddressByCep("13480-000");

    expect(apiFetch).toHaveBeenCalledWith("/shipping/cep/13480000", {
      method: "GET",
      auth: false,
    });
  });

  it("calcula frete por CEP", async () => {
    vi.mocked(apiFetch).mockResolvedValueOnce({
      cep: "13480000",
      shippingPrice: 20,
      estimatedDays: 3,
      street: "Rua Teste",
      district: "Centro",
      city: "Limeira",
      state: "SP",
    });

    await addressService.quoteByCep("13480-000");

    expect(apiFetch).toHaveBeenCalledWith("/shipping/quote?cep=13480000", {
      method: "GET",
      auth: false,
    });
  });
});
