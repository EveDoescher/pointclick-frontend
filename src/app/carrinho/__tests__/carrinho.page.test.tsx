import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import CartPage from "../page";
import { orderFixture } from "@/test/fixtures/orderFixture";
import { userProfileFixture } from "@/test/fixtures/userFixture";

const mocks = vi.hoisted(() => ({
  useAuth: vi.fn(),
  useCart: vi.fn(),
  useFeedbackModal: vi.fn(),
  incrementItem: vi.fn(),
  decrementItem: vi.fn(),
  removeItem: vi.fn(),
  applyCoupon: vi.fn(),
  removeCoupon: vi.fn(),
  quoteShippingByCep: vi.fn(),
  closeCart: vi.fn(),
  refreshProfile: vi.fn(),
  showError: vi.fn(),
  showSuccess: vi.fn(),
  showWarning: vi.fn(),
}));

vi.mock("@/components/auth/ProtectedRoute", () => ({
  ProtectedRoute: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: mocks.useAuth,
}));

vi.mock("@/contexts/CartContext", () => ({
  useCart: mocks.useCart,
}));

vi.mock("@/contexts/FeedbackModalContext", () => ({
  useFeedbackModal: mocks.useFeedbackModal,
}));

vi.mock("@/services/addressService", () => ({
  addressService: {
    findAddressByCep: vi.fn(),
  },
}));

vi.mock("@/services/userService", () => ({
  userService: {
    updateMyAddress: vi.fn(),
  },
}));

function mockCartContext(overrides: Record<string, unknown> = {}) {
  mocks.useCart.mockReturnValue({
    cart: orderFixture,
    cartItems: orderFixture.items,
    cartCount: 1,
    cartSubtotal: 4999.9,
    cartTotal: 5029.8,
    loading: false,
    actionLoading: false,
    incrementItem: mocks.incrementItem,
    decrementItem: mocks.decrementItem,
    removeItem: mocks.removeItem,
    applyCoupon: mocks.applyCoupon,
    removeCoupon: mocks.removeCoupon,
    quoteShippingByCep: mocks.quoteShippingByCep,
    closeCart: mocks.closeCart,
    ...overrides,
  });
}

describe("CartPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mocks.refreshProfile.mockResolvedValue(userProfileFixture);

    mocks.useAuth.mockReturnValue({
      profile: userProfileFixture,
      refreshProfile: mocks.refreshProfile,
    });

    mocks.useFeedbackModal.mockReturnValue({
      showError: mocks.showError,
      showSuccess: mocks.showSuccess,
      showWarning: mocks.showWarning,
    });

    mockCartContext();

    mocks.applyCoupon.mockResolvedValue(undefined);
    mocks.removeCoupon.mockResolvedValue(undefined);
    mocks.quoteShippingByCep.mockResolvedValue({
      shippingPrice: 25,
      estimatedDays: 3,
      city: "Limeira",
      state: "SP",
      street: "Rua Teste",
    });
    mocks.closeCart.mockResolvedValue({
      ...orderFixture,
      id: 99,
      status: "CLOSED",
    });
  });

  it("mostra carrinho vazio quando não há itens", () => {
    mockCartContext({
      cart: null,
      cartItems: [],
      cartCount: 0,
      cartSubtotal: 0,
      cartTotal: 0,
    });

    render(<CartPage />);

    expect(screen.getByText("Seu carrinho está vazio")).toBeInTheDocument();
    expect(screen.getByText("Ver produtos")).toBeInTheDocument();
  });

  it("renderiza itens e resumo do carrinho", () => {
    render(<CartPage />);

    expect(screen.getByText("Carrinho")).toBeInTheDocument();
    expect(screen.getByText("Notebook PointClick Pro")).toBeInTheDocument();
    expect(screen.getByText(`Pedido #${orderFixture.id}`)).toBeInTheDocument();
    expect(screen.getByText("Finalizar compra")).toBeInTheDocument();
  });

  it("altera quantidade e remove item", async () => {
    const user = userEvent.setup();

    render(<CartPage />);

    await user.click(screen.getByRole("button", { name: "+" }));
    await user.click(screen.getByRole("button", { name: "-" }));
    await user.click(screen.getByRole("button", { name: "Remover" }));

    expect(mocks.incrementItem).toHaveBeenCalledWith(orderFixture.items[0]);
    expect(mocks.decrementItem).toHaveBeenCalledWith(orderFixture.items[0]);
    expect(mocks.removeItem).toHaveBeenCalledWith(orderFixture.items[0].id);
  });

  it("aplica cupom e calcula frete", async () => {
    const user = userEvent.setup();

    render(<CartPage />);

    await user.type(screen.getByPlaceholderText("POINT10"), "POINT10");
    await user.click(screen.getByRole("button", { name: "Aplicar" }));

    expect(mocks.applyCoupon).toHaveBeenCalledWith("POINT10");

    await user.clear(screen.getByPlaceholderText("00000-000"));
    await user.type(screen.getByPlaceholderText("00000-000"), "13480000");
    await user.click(screen.getByRole("button", { name: "Calcular" }));

    await waitFor(() => {
      expect(mocks.quoteShippingByCep).toHaveBeenCalledWith("13480000");
    });

    expect(screen.getByText("Limeira/SP")).toBeInTheDocument();
  });

  it("fecha carrinho e redireciona para pagamento", async () => {
    const user = userEvent.setup();

    render(<CartPage />);

    await user.click(screen.getByRole("button", { name: "Finalizar compra" }));

    await waitFor(() => {
      expect(mocks.closeCart).toHaveBeenCalled();
    });

    expect(globalThis.__getNextNavigationMock?.().push).toHaveBeenCalledWith(
      "/pagamento/99"
    );
  });

  it("desabilita ações quando carrinho está em carregamento de ação", () => {
    mockCartContext({
      actionLoading: true,
    });

    render(<CartPage />);

    expect(screen.getByRole("button", { name: "+" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "-" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Remover" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Finalizar compra" })).toBeDisabled();
  });

  it("mostra aviso para CEP inválido no cálculo de frete", async () => {
    const user = userEvent.setup();

    render(<CartPage />);

    await waitFor(() => {
      expect(screen.getByPlaceholderText("00000-000")).toBeInTheDocument();
    });

    await user.clear(screen.getByPlaceholderText("00000-000"));
    await user.type(screen.getByPlaceholderText("00000-000"), "123");
    await user.click(screen.getByRole("button", { name: "Calcular" }));

    expect(mocks.showWarning).toHaveBeenCalledWith(
      "Informe um CEP válido com 8 dígitos."
    );

    expect(mocks.quoteShippingByCep).not.toHaveBeenCalledWith("123");
  });

  it("mantém usuário na tela quando cálculo de frete falha", async () => {
    const user = userEvent.setup();

    mocks.quoteShippingByCep.mockRejectedValueOnce(new Error("CEP inválido"));

    render(<CartPage />);

    await user.clear(screen.getByPlaceholderText("00000-000"));
    await user.type(screen.getByPlaceholderText("00000-000"), "13480000");
    await user.click(screen.getByRole("button", { name: "Calcular" }));

    await waitFor(() => {
      expect(mocks.quoteShippingByCep).toHaveBeenCalledWith("13480000");
    });

    expect(screen.getByText("Carrinho")).toBeInTheDocument();
  });

  it("mostra erro textual ao aplicar cupom inválido", async () => {
    const user = userEvent.setup();

    mocks.applyCoupon.mockRejectedValueOnce(new Error("Cupom inválido"));

    render(<CartPage />);

    await user.type(screen.getByPlaceholderText("POINT10"), "ERRO");
    await user.click(screen.getByRole("button", { name: "Aplicar" }));

    expect(await screen.findByText("Cupom inválido")).toBeInTheDocument();
  });

  it("mostra erro ao finalizar carrinho", async () => {
    const user = userEvent.setup();

    mocks.closeCart.mockRejectedValueOnce(new Error("Falha ao fechar"));

    render(<CartPage />);

    await user.click(screen.getByRole("button", { name: "Finalizar compra" }));

    await waitFor(() => {
      expect(mocks.showError).toHaveBeenCalledWith(
        expect.any(Error),
        "Erro ao fechar pedido"
      );
    });
  });
});
