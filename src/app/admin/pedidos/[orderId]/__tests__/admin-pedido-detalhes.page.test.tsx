import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AdminOrderDetailsPage from "../page";
import { makeOrderFixture } from "@/test/fixtures/orderFixture";

const paidOrder = makeOrderFixture({
  id: 10,
  status: "PAID",
  paidAt: "2026-05-01T11:00:00Z",
  deliveryAddress: "Rua Teste, 123 - Limeira/SP",
});

const shippedOrder = makeOrderFixture({
  ...paidOrder,
  status: "SHIPPED",
  shippedAt: "2026-05-02T11:00:00Z",
});

const closedOrderExpired = makeOrderFixture({
  ...paidOrder,
  status: "CLOSED",
  paidAt: null,
  reservationExpiresAt: "2020-01-01T10:00:00Z",
});

const mocks = vi.hoisted(() => ({
  orderService: {
    findByIdForAdmin: vi.fn(),
    ship: vi.fn(),
    deliver: vi.fn(),
    cancel: vi.fn(),
    reopenExpired: vi.fn(),
  },
  useFeedbackModal: vi.fn(),
  showError: vi.fn(),
}));

vi.mock("@/components/auth/AdminRoute", () => ({
  AdminRoute: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock("@/services/orderService", () => ({
  orderService: mocks.orderService,
}));

vi.mock("@/contexts/FeedbackModalContext", () => ({
  useFeedbackModal: mocks.useFeedbackModal,
}));

function normalizedBodyText() {
  return document.body.textContent?.replace(/\s+/g, "") ?? "";
}

describe("AdminOrderDetailsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    globalThis.__setNextNavigationMock?.({
      params: { orderId: "10" },
      pathname: "/admin/pedidos/10",
    });

    mocks.useFeedbackModal.mockReturnValue({
      showError: mocks.showError,
    });

    mocks.orderService.findByIdForAdmin.mockResolvedValue(paidOrder);
    mocks.orderService.ship.mockResolvedValue(shippedOrder);
    mocks.orderService.deliver.mockResolvedValue({
      ...shippedOrder,
      status: "DELIVERED",
      deliveredAt: "2026-05-03T10:00:00Z",
    });
    mocks.orderService.cancel.mockResolvedValue({
      ...paidOrder,
      status: "CANCELLED",
    });
    mocks.orderService.reopenExpired.mockResolvedValue({
      ...paidOrder,
      status: "PENDING",
    });
  });

  it("carrega detalhes administrativos do pedido", async () => {
    render(<AdminOrderDetailsPage />);

    await waitFor(() => {
      expect(screen.getByText("Detalhes do pedido")).toBeInTheDocument();
    });

    expect(normalizedBodyText()).toContain("Admin•Pedido#10");
    expect(screen.getByText("Produtos do pedido")).toBeInTheDocument();
    expect(screen.getByText("Linha do tempo")).toBeInTheDocument();
  });

  it("abre confirmação e registra envio", async () => {
    const user = userEvent.setup();

    render(<AdminOrderDetailsPage />);

    await waitFor(() => {
      expect(screen.getByText("Detalhes do pedido")).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: "Registrar envio" }));
    expect(screen.getByText("Registrar envio?")).toBeInTheDocument();

    await user.click(
      screen.getAllByRole("button", { name: "Registrar envio" }).at(-1)!
    );

    await waitFor(() => {
      expect(mocks.orderService.ship).toHaveBeenCalledWith(10);
    });
  });

  it("registra entrega para pedido enviado", async () => {
    const user = userEvent.setup();

    mocks.orderService.findByIdForAdmin.mockResolvedValueOnce(shippedOrder);

    render(<AdminOrderDetailsPage />);

    await waitFor(() => {
      expect(screen.getByText("Detalhes do pedido")).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: "Registrar entrega" }));
    expect(screen.getByText("Registrar entrega?")).toBeInTheDocument();

    await user.click(
      screen.getAllByRole("button", { name: "Registrar entrega" }).at(-1)!
    );

    await waitFor(() => {
      expect(mocks.orderService.deliver).toHaveBeenCalledWith(10);
    });
  });

  it("cancela pedido fechado", async () => {
    const user = userEvent.setup();

    mocks.orderService.findByIdForAdmin.mockResolvedValueOnce({
      ...closedOrderExpired,
      reservationExpiresAt: null,
    });

    render(<AdminOrderDetailsPage />);

    await waitFor(() => {
      expect(screen.getByText("Cancelar pedido")).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: "Cancelar pedido" }));
    expect(screen.getByText("Cancelar pedido?")).toBeInTheDocument();

    await user.click(
      screen.getAllByRole("button", { name: "Cancelar pedido" }).at(-1)!
    );

    await waitFor(() => {
      expect(mocks.orderService.cancel).toHaveBeenCalledWith(10);
    });
  });

  it("reabre reserva expirada", async () => {
    const user = userEvent.setup();

    mocks.orderService.findByIdForAdmin.mockResolvedValueOnce(closedOrderExpired);

    render(<AdminOrderDetailsPage />);

    await waitFor(() => {
      expect(screen.getByText("Reabrir reserva expirada")).toBeInTheDocument();
    });

    await user.click(
      screen.getByRole("button", { name: "Reabrir reserva expirada" })
    );

    expect(screen.getByText("Reabrir reserva expirada?")).toBeInTheDocument();

    await user.click(
      screen.getAllByRole("button", { name: "Reabrir pedido" }).at(-1)!
    );

    await waitFor(() => {
      expect(mocks.orderService.reopenExpired).toHaveBeenCalledWith(10);
    });
  });

  it("mostra erro quando carregamento falha", async () => {
    mocks.orderService.findByIdForAdmin.mockRejectedValueOnce(new Error("Falha"));

    render(<AdminOrderDetailsPage />);

    await waitFor(() => {
      expect(mocks.showError).toHaveBeenCalledWith(
        expect.any(Error),
        "Erro ao carregar pedido"
      );
    });
  });
});
