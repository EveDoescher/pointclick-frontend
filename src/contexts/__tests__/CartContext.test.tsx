import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CartProvider, useCart } from "../CartContext";
import { authenticatedCustomerFixture } from "@/test/fixtures/userFixture";
import { makeOrderFixture, orderFixture } from "@/test/fixtures/orderFixture";
import { productFixture } from "@/test/fixtures/productFixture";

const mocks = vi.hoisted(() => ({
  useAuth: vi.fn(),
  orderService: {
    findCurrentCart: vi.fn(),
    create: vi.fn(),
    addItem: vi.fn(),
    updateItem: vi.fn(),
    removeItem: vi.fn(),
    applyCoupon: vi.fn(),
    removeCoupon: vi.fn(),
    quoteShipping: vi.fn(),
    close: vi.fn(),
  },
  addressService: {
    quoteByCep: vi.fn(),
  },
}));

vi.mock("../AuthContext", () => ({
  useAuth: mocks.useAuth,
}));

vi.mock("@/services/orderService", () => ({
  orderService: mocks.orderService,
}));

vi.mock("@/services/addressService", () => ({
  addressService: mocks.addressService,
}));

function CartConsumer() {
  const {
    cart,
    cartCount,
    cartSubtotal,
    cartTotal,
    cartToast,
    refreshCart,
    addToCart,
    incrementItem,
    decrementItem,
    removeItem,
    applyCoupon,
    removeCoupon,
    quoteShippingByCep,
    closeCart,
    hideCartToast,
  } = useCart();

  const firstItem = cart?.items[0];

  return (
    <div>
      <p data-testid="cart-id">{cart?.id ?? "sem carrinho"}</p>
      <p data-testid="cart-count">{cartCount}</p>
      <p data-testid="cart-subtotal">{cartSubtotal}</p>
      <p data-testid="cart-total">{cartTotal}</p>
      <p data-testid="toast-visible">{String(cartToast.visible)}</p>

      <button type="button" onClick={() => refreshCart()}>
        atualizar
      </button>
      <button type="button" onClick={() => addToCart(productFixture, 1)}>
        adicionar
      </button>
      <button type="button" onClick={() => firstItem && incrementItem(firstItem)}>
        incrementar
      </button>
      <button type="button" onClick={() => firstItem && decrementItem(firstItem)}>
        decrementar
      </button>
      <button type="button" onClick={() => firstItem && removeItem(firstItem.id)}>
        remover
      </button>
      <button type="button" onClick={() => applyCoupon("POINT10")}>
        cupom
      </button>
      <button type="button" onClick={() => removeCoupon()}>
        remover cupom
      </button>
      <button type="button" onClick={() => quoteShippingByCep("13480-000")}>
        frete
      </button>
      <button type="button" onClick={() => closeCart()}>
        fechar
      </button>
      <button type="button" onClick={() => hideCartToast()}>
        ocultar toast
      </button>
    </div>
  );
}

function renderCartProvider() {
  return render(
    <CartProvider>
      <CartConsumer />
    </CartProvider>
  );
}

describe("CartContext", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mocks.useAuth.mockReturnValue({
      user: authenticatedCustomerFixture,
      isAuthenticated: true,
    });

    mocks.orderService.findCurrentCart.mockResolvedValue(orderFixture);
    mocks.orderService.create.mockResolvedValue(orderFixture);
    mocks.orderService.addItem.mockResolvedValue(orderFixture);
    mocks.orderService.updateItem.mockResolvedValue(orderFixture);
    mocks.orderService.removeItem.mockResolvedValue(orderFixture);
    mocks.orderService.applyCoupon.mockResolvedValue(
      makeOrderFixture({ couponCode: "POINT10", discountAmount: 10 })
    );
    mocks.orderService.removeCoupon.mockResolvedValue(orderFixture);
    mocks.orderService.close.mockResolvedValue(
      makeOrderFixture({ status: "CLOSED" })
    );
    mocks.addressService.quoteByCep.mockResolvedValue({
      cep: "13480000",
      shippingPrice: 20,
      estimatedDays: 3,
      street: "Rua Teste",
      district: "Centro",
      city: "Limeira",
      state: "SP",
    });
  });

  it("carrega carrinho atual no bootstrap", async () => {
    renderCartProvider();

    await waitFor(() => {
      expect(screen.getByTestId("cart-id")).toHaveTextContent(String(orderFixture.id));
    });

    expect(screen.getByTestId("cart-count")).toHaveTextContent("1");
    expect(screen.getByTestId("cart-subtotal")).toHaveTextContent("4999.9");
    expect(screen.getByTestId("cart-total")).toHaveTextContent("5029.8");
  });

  it("adiciona produto ao carrinho e exibe toast local", async () => {
    const user = userEvent.setup();

    renderCartProvider();

    await waitFor(() => {
      expect(screen.getByTestId("cart-id")).toHaveTextContent(String(orderFixture.id));
    });

    await user.click(screen.getByRole("button", { name: "adicionar" }));

    expect(mocks.orderService.addItem).toHaveBeenCalledWith(orderFixture.id, {
      productId: productFixture.id,
      quantity: 1,
    });
    expect(screen.getByTestId("toast-visible")).toHaveTextContent("true");
  });

  it("atualiza, remove item e aplica/remove cupom", async () => {
    const user = userEvent.setup();

    renderCartProvider();

    await waitFor(() => {
      expect(screen.getByTestId("cart-id")).toHaveTextContent(String(orderFixture.id));
    });

    await user.click(screen.getByRole("button", { name: "incrementar" }));
    await user.click(screen.getByRole("button", { name: "decrementar" }));
    await user.click(screen.getByRole("button", { name: "remover" }));
    await user.click(screen.getByRole("button", { name: "cupom" }));
    await user.click(screen.getByRole("button", { name: "remover cupom" }));

    expect(mocks.orderService.updateItem).toHaveBeenCalledWith(
      orderFixture.id,
      orderFixture.items[0].id,
      { quantity: 2 }
    );
    expect(mocks.orderService.removeItem).toHaveBeenCalled();
    expect(mocks.orderService.applyCoupon).toHaveBeenCalledWith(orderFixture.id, {
      code: "POINT10",
    });
    expect(mocks.orderService.removeCoupon).toHaveBeenCalledWith(orderFixture.id);
  });

  it("calcula frete por CEP e fecha carrinho", async () => {
    const user = userEvent.setup();

    renderCartProvider();

    await waitFor(() => {
      expect(screen.getByTestId("cart-id")).toHaveTextContent(String(orderFixture.id));
    });

    await user.click(screen.getByRole("button", { name: "frete" }));
    await user.click(screen.getByRole("button", { name: "fechar" }));

    expect(mocks.addressService.quoteByCep).toHaveBeenCalledWith("13480-000");
    expect(mocks.orderService.close).toHaveBeenCalledWith(orderFixture.id);
    expect(screen.getByTestId("cart-id")).toHaveTextContent("sem carrinho");
  });

  it("limpa carrinho local quando usuário não está autenticado", async () => {
    mocks.useAuth.mockReturnValue({
      user: null,
      isAuthenticated: false,
    });

    renderCartProvider();

    await waitFor(() => {
      expect(screen.getByTestId("cart-id")).toHaveTextContent("sem carrinho");
    });

    expect(mocks.orderService.findCurrentCart).not.toHaveBeenCalled();
  });
});
