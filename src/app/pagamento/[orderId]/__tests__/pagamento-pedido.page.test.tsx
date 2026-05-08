import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import PaymentOrderPage from "../page";
import { makeOrderFixture } from "@/test/fixtures/orderFixture";

const closedOrder = makeOrderFixture({
  id: 10,
  status: "CLOSED",
  paymentMethod: null,
  items: [
    {
      id: 100,
      productId: 1,
      productName: "Notebook PointClick Pro",
      productBrand: "PointClick",
      productCategory: "Notebook",
      productImageUrl: null,
      quantity: 1,
      unitPriceAtMoment: 4999.9,
      subtotal: 4999.9,
      createdAt: "2026-05-01T10:00:00Z",
      updatedAt: "2026-05-01T10:00:00Z",
    },
  ],
});

const paymentPix = {
  id: 1,
  orderId: 10,
  method: "PIX" as const,
  status: "PENDING" as const,
  amount: 5029.8,
  installments: null,
  cardLastFourDigits: null,
  pixCode: "PIX-CODE-123",
  pixQrCodeBase64: null,
  pixConfirmationUrl: "https://example.com/pix",
  bankSlipBarCode: null,
  bankSlipBarCodeBase64: null,
  bankSlipConfirmationUrl: null,
  digitableLine: null,
  notes: null,
  createdAt: "2026-05-01T10:00:00Z",
  confirmedAt: null,
  cancelledAt: null,
};

const mocks = vi.hoisted(() => ({
  orderService: {
    findById: vi.fn(),
  },
  paymentService: {
    findByOrderId: vi.fn(),
    createPayment: vi.fn(),
  },
  useFeedbackModal: vi.fn(),
  showError: vi.fn(),
  showInfo: vi.fn(),
  showWarning: vi.fn(),
}));

vi.mock("@/components/auth/ProtectedRoute", () => ({
  ProtectedRoute: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock("@/services/orderService", () => ({
  orderService: mocks.orderService,
}));

vi.mock("@/services/paymentService", () => ({
  paymentService: mocks.paymentService,
}));

vi.mock("@/contexts/FeedbackModalContext", () => ({
  useFeedbackModal: mocks.useFeedbackModal,
}));

describe("PaymentOrderPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    globalThis.__setNextNavigationMock?.({
      params: { orderId: "10" },
      pathname: "/pagamento/10",
    });

    mocks.useFeedbackModal.mockReturnValue({
      showError: mocks.showError,
      showInfo: mocks.showInfo,
      showWarning: mocks.showWarning,
    });

    mocks.orderService.findById.mockResolvedValue(closedOrder);
    mocks.paymentService.findByOrderId.mockRejectedValue(
      Object.assign(new Error("sem pagamento"), { status: 404 })
    );
    mocks.paymentService.createPayment.mockResolvedValue(paymentPix);
  });

  it("carrega pedido aguardando pagamento", async () => {
    render(<PaymentOrderPage />);

    expect(
      await screen.findByRole("heading", { name: /Pedido #\s*10/i })
    ).toBeInTheDocument();

    expect(screen.getByText("Notebook PointClick Pro")).toBeInTheDocument();
    expect(screen.getByText("Escolha como pagar")).toBeInTheDocument();
  });

  it("gera pagamento PIX", async () => {
    const user = userEvent.setup();

    render(<PaymentOrderPage />);

    expect(
      await screen.findByRole("heading", { name: /Pedido #\s*10/i })
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Gerar pagamento" }));

    await waitFor(() => {
      expect(mocks.paymentService.createPayment).toHaveBeenCalledWith(
        10,
        expect.objectContaining({
          paymentMethod: "PIX",
        })
      );
    });

    expect(await screen.findByText("Código PIX")).toBeInTheDocument();
  });

  it("valida mês inválido no cartão", async () => {
    const user = userEvent.setup();

    render(<PaymentOrderPage />);

    expect(
      await screen.findByRole("heading", { name: /Pedido #\s*10/i })
    ).toBeInTheDocument();

    await user.click(screen.getByText("Cartão de crédito"));
    await user.type(
      screen.getByPlaceholderText("4111 1111 1111 1111"),
      "4111111111111111"
    );
    await user.type(screen.getByPlaceholderText("ANA SOUZA"), "ANA SOUZA");
    await user.type(screen.getByPlaceholderText("MM/AA"), "13/32");
    await user.type(screen.getByPlaceholderText("123"), "123");

    await user.click(screen.getByRole("button", { name: "Gerar pagamento" }));

    expect(
      screen.getByText("Informe um mês válido entre 01 e 12.")
    ).toBeInTheDocument();
    expect(mocks.paymentService.createPayment).not.toHaveBeenCalled();
  });
});
