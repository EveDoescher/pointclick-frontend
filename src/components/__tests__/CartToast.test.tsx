import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CartToast } from "../cart/CartToast";

const mocks = vi.hoisted(() => ({
  useCart: vi.fn(),
  hideCartToast: vi.fn(),
}));

vi.mock("@/contexts/CartContext", () => ({
  useCart: mocks.useCart,
}));

describe("CartToast", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("não renderiza quando toast está invisível", () => {
    mocks.useCart.mockReturnValue({
      cartToast: {
        visible: false,
        productName: "",
        productImageUrl: null,
        quantity: 0,
      },
      hideCartToast: mocks.hideCartToast,
    });

    render(<CartToast />);

    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("renderiza produto adicionado ao carrinho", () => {
    mocks.useCart.mockReturnValue({
      cartToast: {
        visible: true,
        productName: "Notebook PointClick Pro",
        productImageUrl: null,
        quantity: 2,
      },
      hideCartToast: mocks.hideCartToast,
    });

    render(<CartToast />);

    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.getByText("Notebook PointClick Pro")).toBeInTheDocument();
    expect(screen.getByText("2 unidades")).toBeInTheDocument();
  });

  it("fecha toast ao clicar no botão de fechar", async () => {
    const user = userEvent.setup();

    mocks.useCart.mockReturnValue({
      cartToast: {
        visible: true,
        productName: "Notebook PointClick Pro",
        productImageUrl: null,
        quantity: 1,
      },
      hideCartToast: mocks.hideCartToast,
    });

    render(<CartToast />);

    await user.click(screen.getByRole("button", { name: "Fechar aviso" }));

    expect(mocks.hideCartToast).toHaveBeenCalled();
  });
});
