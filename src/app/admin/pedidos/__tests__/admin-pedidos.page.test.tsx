import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AdminOrdersPage from "../page";

const adminOrders = [
  {
    id: 10,
    customerId: 1,
    customerName: "Cliente PointClick",
    customerEmail: "cliente@pointclick.com",
    status: "PAID" as const,
    itemsAmount: 4999.9,
    discountAmount: 0,
    freightAmount: 29.9,
    totalAmount: 5029.8,
    couponCode: null,
    paymentMethod: "PIX" as const,
    paidAt: "2026-05-01T11:00:00Z",
    shippedAt: null,
    deliveredAt: null,
    finishedAt: null,
    createdAt: "2026-05-01T10:00:00Z",
  },
];

const summary = {
  pending: 0,
  closed: 2,
  paid: 1,
  shipped: 0,
  delivered: 0,
  finished: 0,
  cancelled: 0,
};

const mocks = vi.hoisted(() => ({
  orderService: {
    findAllForAdmin: vi.fn(),
    getStatusSummary: vi.fn(),
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

describe("AdminOrdersPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mocks.useFeedbackModal.mockReturnValue({
      showError: mocks.showError,
    });

    mocks.orderService.findAllForAdmin.mockResolvedValue(adminOrders);
    mocks.orderService.getStatusSummary.mockResolvedValue(summary);
  });

  it("lista pedidos administrativos", async () => {
    render(<AdminOrdersPage />);

    expect(screen.getByText("Admin • Pedidos")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("Cliente PointClick")).toBeInTheDocument();
    });

    expect(screen.getByText("cliente@pointclick.com")).toBeInTheDocument();
    expect(screen.getByText("Pedidos cadastrados")).toBeInTheDocument();
  });

  it("filtra busca por cliente", async () => {
    const user = userEvent.setup();

    render(<AdminOrdersPage />);

    await waitFor(() => {
      expect(screen.getByText("Cliente PointClick")).toBeInTheDocument();
    });

    await user.type(
      screen.getByPlaceholderText("Buscar pedido, cliente ou e-mail"),
      "cliente"
    );

    expect(screen.getByText("Cliente PointClick")).toBeInTheDocument();
  });
});
