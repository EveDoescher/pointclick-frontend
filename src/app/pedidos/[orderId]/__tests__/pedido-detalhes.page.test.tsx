import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import OrderDetailsPage from "../page";
import { makeOrderFixture } from "@/test/fixtures/orderFixture";

const deliveredOrder = makeOrderFixture({
  id: 10,
  status: "DELIVERED",
  deliveredAt: "2026-05-02T10:00:00Z",
  deliveryAddress: "Rua Teste, 123 - Limeira/SP",
});

const finishedOrder = makeOrderFixture({
  id: 10,
  status: "FINISHED",
  deliveredAt: "2026-05-02T10:00:00Z",
  finishedAt: "2026-05-03T10:00:00Z",
  deliveryAddress: "Rua Teste, 123 - Limeira/SP",
});

const mocks = vi.hoisted(() => ({
  orderService: {
    findById: vi.fn(),
    confirmDelivery: vi.fn(),
    cancel: vi.fn(),
  },
  reviewService: {
    findMyReviews: vi.fn(),
    create: vi.fn(),
  },
  useFeedbackModal: vi.fn(),
  showError: vi.fn(),
  showSuccess: vi.fn(),
  showWarning: vi.fn(),
}));

vi.mock("@/components/auth/ProtectedRoute", () => ({
  ProtectedRoute: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock("@/services/orderService", () => ({
  orderService: mocks.orderService,
}));

vi.mock("@/services/reviewService", () => ({
  reviewService: mocks.reviewService,
}));

vi.mock("@/contexts/FeedbackModalContext", () => ({
  useFeedbackModal: mocks.useFeedbackModal,
}));

describe("OrderDetailsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    globalThis.__setNextNavigationMock?.({
      params: { orderId: "10" },
      pathname: "/pedidos/10",
    });

    mocks.useFeedbackModal.mockReturnValue({
      showError: mocks.showError,
      showSuccess: mocks.showSuccess,
      showWarning: mocks.showWarning,
    });

    mocks.orderService.findById.mockResolvedValue(deliveredOrder);
    mocks.orderService.confirmDelivery.mockResolvedValue(finishedOrder);
    mocks.orderService.cancel.mockResolvedValue({
      ...deliveredOrder,
      status: "CANCELLED",
    });
    mocks.reviewService.findMyReviews.mockResolvedValue([]);
    mocks.reviewService.create.mockResolvedValue({
      id: 1,
      orderId: 10,
      productId: 1,
      productName: "Notebook PointClick Pro",
      userId: 1,
      userFullName: "Cliente PointClick",
      userAvatarUrl: null,
      rating: 5,
      comment: "Ótimo produto",
      imageCount: 0,
      images: [],
      active: true,
      createdAt: "2026-05-03T10:00:00Z",
      updatedAt: "2026-05-03T10:00:00Z",
    });
  });

  it("carrega detalhes do pedido", async () => {
    render(<OrderDetailsPage />);

    await waitFor(() => {
      expect(screen.getByText("Detalhes do pedido")).toBeInTheDocument();
    });

    expect(
      screen.getByRole("heading", { name: /Pedido #\s*10/i })
    ).toBeInTheDocument();
    expect(screen.getByText("Notebook PointClick Pro")).toBeInTheDocument();
  });

  it("confirma recebimento", async () => {
    const user = userEvent.setup();

    render(<OrderDetailsPage />);

    await waitFor(() => {
      expect(screen.getByText("Detalhes do pedido")).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: "Confirmar recebimento" }));

    await waitFor(() => {
      expect(mocks.orderService.confirmDelivery).toHaveBeenCalledWith(10);
    });

    expect(mocks.showSuccess).toHaveBeenCalledWith(
      "Recebimento confirmado com sucesso."
    );
  });

  it("envia avaliação de produto finalizado", async () => {
    const user = userEvent.setup();

    mocks.orderService.findById.mockResolvedValueOnce(finishedOrder);

    render(<OrderDetailsPage />);

    await waitFor(() => {
      expect(screen.getByText("Avalie os produtos do pedido")).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: "5 estrelas" }));
    await user.type(
      screen.getByPlaceholderText("Conte como foi sua experiência com o produto."),
      "Ótimo produto"
    );
    await user.click(screen.getByRole("button", { name: "Enviar avaliação" }));

    await waitFor(() => {
      expect(mocks.reviewService.create).toHaveBeenCalledWith(
        10,
        1,
        expect.objectContaining({
          rating: 5,
          comment: "Ótimo produto",
        })
      );
    });
  });
});
