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
import { orderService } from "../orderService";
import { orderFixture } from "@/test/fixtures/orderFixture";

describe("orderService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("cria pedido", async () => {
    vi.mocked(apiFetch).mockResolvedValueOnce(orderFixture);

    await orderService.create({ userId: 1 });

    expect(apiFetch).toHaveBeenCalledWith("/orders", {
      method: "POST",
      body: { userId: 1 },
    });
  });

  it("retorna carrinho atual", async () => {
    vi.mocked(apiFetch).mockResolvedValueOnce(orderFixture);

    await expect(orderService.findCurrentCart()).resolves.toEqual(orderFixture);

    expect(apiFetch).toHaveBeenCalledWith("/orders/current", {
      method: "GET",
    });
  });

  it("retorna null quando carrinho atual responde 204", async () => {
    const error = new Error("No content") as Error & { status: number };
    error.status = 204;

    vi.mocked(apiFetch).mockRejectedValueOnce(error);

    await expect(orderService.findCurrentCart()).resolves.toBeNull();
  });

  it("lista pedidos do cliente e pedidos admin", async () => {
    vi.mocked(apiFetch).mockResolvedValue([]);

    await orderService.findMyOrders();
    await orderService.findAllForAdmin("PAID");

    expect(apiFetch).toHaveBeenNthCalledWith(1, "/orders/my", {
      method: "GET",
    });
    expect(apiFetch).toHaveBeenNthCalledWith(2, "/orders?status=PAID", {
      method: "GET",
    });
  });

  it("executa ações principais do pedido", async () => {
    vi.mocked(apiFetch).mockResolvedValue(orderFixture);

    await orderService.findById(10);
    await orderService.findByIdForAdmin(10);
    await orderService.addItem(10, { productId: 1, quantity: 2 });
    await orderService.updateItem(10, 100, { quantity: 3 });
    await orderService.removeItem(10, 100);
    await orderService.applyCoupon(10, { code: "POINT10" });
    await orderService.removeCoupon(10);
    await orderService.close(10);
    await orderService.ship(10);
    await orderService.deliver(10);
    await orderService.confirmDelivery(10);
    await orderService.finish(10);
    await orderService.cancel(10);
    await orderService.reopenExpired(10);

    expect(apiFetch).toHaveBeenCalledWith("/orders/10", { method: "GET" });
    expect(apiFetch).toHaveBeenCalledWith("/orders/admin/10", { method: "GET" });
    expect(apiFetch).toHaveBeenCalledWith("/orders/10/items", {
      method: "POST",
      body: { productId: 1, quantity: 2 },
    });
    expect(apiFetch).toHaveBeenCalledWith("/orders/10/items/100", {
      method: "PUT",
      body: { quantity: 3 },
    });
    expect(apiFetch).toHaveBeenCalledWith("/orders/10/items/100", {
      method: "DELETE",
    });
    expect(apiFetch).toHaveBeenCalledWith("/orders/10/coupon", {
      method: "POST",
      body: { code: "POINT10" },
    });
    expect(apiFetch).toHaveBeenCalledWith("/orders/10/coupon", {
      method: "DELETE",
    });
    expect(apiFetch).toHaveBeenCalledWith("/orders/10/close", { method: "POST" });
    expect(apiFetch).toHaveBeenCalledWith("/orders/10/ship", { method: "POST" });
    expect(apiFetch).toHaveBeenCalledWith("/orders/10/deliver", { method: "POST" });
    expect(apiFetch).toHaveBeenCalledWith("/orders/10/confirm-delivery", {
      method: "POST",
    });
    expect(apiFetch).toHaveBeenCalledWith("/orders/10/finish", { method: "POST" });
    expect(apiFetch).toHaveBeenCalledWith("/orders/10/cancel", { method: "POST" });
    expect(apiFetch).toHaveBeenCalledWith("/orders/10/reopen-expired", {
      method: "POST",
    });
  });

  it("busca resumo por status", async () => {
    vi.mocked(apiFetch).mockResolvedValueOnce({
      pending: 0,
      closed: 1,
      paid: 2,
      shipped: 0,
      delivered: 0,
      finished: 0,
      cancelled: 0,
    });

    await orderService.getStatusSummary();

    expect(apiFetch).toHaveBeenCalledWith("/orders/summary", {
      method: "GET",
    });
  });
});
