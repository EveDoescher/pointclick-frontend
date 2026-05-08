import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ProductCard } from "../products/ProductCard";
import {
  makeProductFixture,
  productFixture,
} from "@/test/fixtures/productFixture";

const mocks = vi.hoisted(() => ({
  useAuth: vi.fn(),
  useCart: vi.fn(),
  useFeedbackModal: vi.fn(),
  addToCart: vi.fn(),
  showError: vi.fn(),
  showInfo: vi.fn(),
  favoriteService: {
    existsForCurrentUser: vi.fn(),
    addFavorite: vi.fn(),
    removeFavorite: vi.fn(),
  },
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

vi.mock("@/services/favoriteService", () => ({
  favoriteService: mocks.favoriteService,
}));

describe("ProductCard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();

    mocks.useAuth.mockReturnValue({
      isAuthenticated: true,
    });

    mocks.useCart.mockReturnValue({
      addToCart: mocks.addToCart,
      actionLoading: false,
    });

    mocks.useFeedbackModal.mockReturnValue({
      showError: mocks.showError,
      showInfo: mocks.showInfo,
    });

    mocks.favoriteService.existsForCurrentUser.mockResolvedValue(false);
    mocks.favoriteService.addFavorite.mockResolvedValue({});
    mocks.favoriteService.removeFavorite.mockResolvedValue(undefined);
    mocks.addToCart.mockResolvedValue({});
  });

  it("renderiza dados principais do produto", async () => {
    render(<ProductCard product={productFixture} />);

    expect(screen.getByText(productFixture.name)).toBeInTheDocument();
    expect(screen.getByText(productFixture.brand)).toBeInTheDocument();
    expect(screen.getByText("Preço")).toBeInTheDocument();

    await waitFor(() => {
      expect(mocks.favoriteService.existsForCurrentUser).toHaveBeenCalledWith(
        productFixture.id
      );
    });
  });

  it("adiciona produto ao carrinho quando autenticado", async () => {
    const user = userEvent.setup();

    render(<ProductCard product={productFixture} />);

    await user.click(screen.getByRole("button", { name: /^Adicionar$/ }));

    expect(mocks.addToCart).toHaveBeenCalledWith(productFixture, 1);
  });

  it("redireciona ação bloqueada para login quando deslogado", async () => {
    const user = userEvent.setup();

    mocks.useAuth.mockReturnValue({
      isAuthenticated: false,
    });

    render(<ProductCard product={productFixture} />);

    await user.click(screen.getByRole("button", { name: /^Adicionar$/ }));

    expect(mocks.addToCart).not.toHaveBeenCalled();
    expect(
      sessionStorage.getItem("pointclick_login_required_feedback")
    ).toContain("Login necessário");
  });

  it("mantém botão de compra desabilitado quando produto está indisponível", async () => {
    const user = userEvent.setup();

    const unavailableProduct = makeProductFixture({
      active: true,
      outOfStock: true,
      availableQuantity: 0,
    });

    render(<ProductCard product={unavailableProduct} />);

    const unavailableButton = screen.getByRole("button", {
      name: "Indisponível",
    });

    expect(unavailableButton).toBeDisabled();

    await user.click(unavailableButton);

    expect(mocks.addToCart).not.toHaveBeenCalled();
  });

  it("alterna favorito", async () => {
    const user = userEvent.setup();

    render(<ProductCard product={productFixture} />);

    await user.click(
      screen.getByRole("button", { name: "Adicionar aos favoritos" })
    );

    expect(mocks.favoriteService.addFavorite).toHaveBeenCalledWith(
      productFixture.id
    );
  });
});
