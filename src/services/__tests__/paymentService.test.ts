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
import { paymentService } from "../paymentService";

describe("paymentService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("cria pagamento", async () => {
    const request = {
      paymentMethod: "PIX" as const,
      notes: "teste",
    };

    vi.mocked(apiFetch).mockResolvedValueOnce({ id: 1 });

    await paymentService.createPayment(10, request);

    expect(apiFetch).toHaveBeenCalledWith("/payments/orders/10", {
      method: "POST",
      body: request,
    });
  });

  it("busca e cancela pagamento", async () => {
    vi.mocked(apiFetch).mockResolvedValue({ id: 1 });

    await paymentService.findByOrderId(10);
    await paymentService.cancelPayment(1);

    expect(apiFetch).toHaveBeenNthCalledWith(1, "/payments/orders/10", {
      method: "GET",
    });
    expect(apiFetch).toHaveBeenNthCalledWith(2, "/payments/1/cancel", {
      method: "POST",
    });
  });

  it("confirma PIX e boleto sem autenticação", async () => {
    vi.mocked(apiFetch).mockResolvedValue({ id: 1 });

    await paymentService.confirmPixPayment(1, "token teste");
    await paymentService.confirmBankSlipPayment(2, "token teste");

    expect(apiFetch).toHaveBeenNthCalledWith(
      1,
      "/payments/1/confirm-pix?token=token%20teste",
      {
        method: "POST",
        auth: false,
      }
    );

    expect(apiFetch).toHaveBeenNthCalledWith(
      2,
      "/payments/2/confirm-bank-slip?token=token%20teste",
      {
        method: "POST",
        auth: false,
      }
    );
  });
});
