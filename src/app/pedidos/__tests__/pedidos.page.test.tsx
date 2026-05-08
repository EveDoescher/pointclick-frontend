import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import MyOrdersPage from "../page";

const orders = [
  {
    id: 10,
    orderDate: "2026-05-01T10:00:00Z",
    itemsAmount: 4999.9,
    discountAmount: 0,
    freightAmount: 29.9,
    totalAmount: 5029.8,
    couponCode: null,
    status: "CLOSED" as const,
    paymentMethod: "PIX" as const,
    createdAt: "2026-05-01T10:00:00Z",
  },
  {
    id: 11,
    orderDate: "2026-05-02T10:00:00Z",
    itemsAmount: 699.9,
    discountAmount: 0,
    freightAmount: 20,
    totalAmount: 719.9,
    couponCode: null,
    status: "FINISHED" as const,
    paymentMethod: "CREDIT_CARD" as const,
    createdAt: "2026-05-02T10:00:00Z",
  },
  {
    id: 12,
    orderDate: "2026-05-03T10:00:00Z",
    itemsAmount: 100,
    discountAmount: 0,
    freightAmount: 0,
    totalAmount: 100,
    couponCode: null,
    status: "PENDING" as const,
    paymentMethod: null,
    createdAt: "2026-05-03T10:00:00Z",
  },
];

const mocks = vi.hoisted(() => ({
  orderService: {
    findMyOrders: vi.fn(),
  },
  useFeedbackModal: vi.fn(),
  showError: vi.fn(),
}));

vi.mock("@/components/auth/ProtectedRoute", () => ({
  ProtectedRoute: ({ children }: { children: React.ReactNode }) => <>{children}</>,
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

describe("MyOrdersPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mocks.useFeedbackModal.mockReturnValue({
      showError: mocks.showError,
    });

    mocks.orderService.findMyOrders.mockResolvedValue(orders);
  });

  it("lista pedidos do usuário sem carrinho aberto", async () => {
    render(<MyOrdersPage />);

    expect(screen.getByText("Meus pedidos")).toBeInTheDocument();

    await waitFor(() => {
      expect(normalizedBodyText()).toContain("#10");
    });

    expect(normalizedBodyText()).toContain("#11");
    expect(normalizedBodyText()).not.toContain("#12");
  });

  it("filtra por status", async () => {
    const user = userEvent.setup();

    render(<MyOrdersPage />);

    await waitFor(() => {
      expect(normalizedBodyText()).toContain("#10");
    });

    await user.click(screen.getByRole("button", { name: "Finalizado" }));

    await waitFor(() => {
      expect(normalizedBodyText()).toContain("#11");
    });

    expect(normalizedBodyText()).not.toContain("#10");
  });

  it("exibe estado vazio", async () => {
    mocks.orderService.findMyOrders.mockResolvedValueOnce([]);

    render(<MyOrdersPage />);

    await waitFor(() => {
      expect(screen.getByText("Nenhum pedido encontrado")).toBeInTheDocument();
    });
  });
});
