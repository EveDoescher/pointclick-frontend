import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ProductsPage from "../page";
import { makeProductFixture, productFixture } from "@/test/fixtures/productFixture";

const mocks = vi.hoisted(() => ({
  productService: {
    findAll: vi.fn(),
    findCategoryGroups: vi.fn(),
    findCategories: vi.fn(),
    findBrands: vi.fn(),
  },
  favoriteService: {
    existsForCurrentUser: vi.fn(),
    addFavorite: vi.fn(),
    removeFavorite: vi.fn(),
  },
  useAuth: vi.fn(),
  useCart: vi.fn(),
  useFeedbackModal: vi.fn(),
  addToCart: vi.fn(),
  showError: vi.fn(),
  showInfo: vi.fn(),
}));

vi.mock("@/services/productService", () => ({
  productService: mocks.productService,
}));

vi.mock("@/services/favoriteService", () => ({
  favoriteService: mocks.favoriteService,
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

describe("ProductsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mocks.useAuth.mockReturnValue({
      isAuthenticated: true,
    });

    mocks.useCart.mockReturnValue({
      addToCart: mocks.addToCart,
    });

    mocks.useFeedbackModal.mockReturnValue({
      showError: mocks.showError,
      showInfo: mocks.showInfo,
    });

    mocks.productService.findCategoryGroups.mockResolvedValue([
      "Computadores e Mobile",
      "Áudio",
    ]);
    mocks.productService.findCategories.mockResolvedValue(["Notebook", "Headset"]);
    mocks.productService.findBrands.mockResolvedValue(["PointClick", "AudioLab"]);
    mocks.productService.findAll.mockResolvedValue([
      productFixture,
      makeProductFixture({
        id: 2,
        name: "Headset Studio",
        brand: "AudioLab",
        categoryGroup: "Áudio",
        category: "Headset",
        price: 699.9,
      }),
    ]);

    mocks.favoriteService.existsForCurrentUser.mockResolvedValue(false);
    mocks.favoriteService.addFavorite.mockResolvedValue({});
    mocks.favoriteService.removeFavorite.mockResolvedValue(undefined);
    mocks.addToCart.mockResolvedValue({});
  });

  it("carrega catálogo e opções de filtro", async () => {
    render(<ProductsPage />);

    expect(screen.getByText("Eletrônicos e acessórios")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("Notebook PointClick Pro")).toBeInTheDocument();
    });

    expect(screen.getByText("Headset Studio")).toBeInTheDocument();
    expect(mocks.productService.findCategoryGroups).toHaveBeenCalled();
    expect(mocks.productService.findCategories).toHaveBeenCalled();
    expect(mocks.productService.findBrands).toHaveBeenCalled();
  });

  it("adiciona produto ao carrinho", async () => {
    const user = userEvent.setup();

    render(<ProductsPage />);

    await waitFor(() => {
      expect(screen.getByText("Notebook PointClick Pro")).toBeInTheDocument();
    });

    await user.click(screen.getAllByRole("button", { name: /^Adicionar$/ })[0]);

    expect(mocks.addToCart).toHaveBeenCalledWith(productFixture, 1);
  });

  it("redireciona visitante para login ao tentar adicionar", async () => {
    const user = userEvent.setup();

    mocks.useAuth.mockReturnValue({
      isAuthenticated: false,
    });

    render(<ProductsPage />);

    await waitFor(() => {
      expect(screen.getByText("Notebook PointClick Pro")).toBeInTheDocument();
    });

    await user.click(screen.getAllByRole("button", { name: /^Adicionar$/ })[0]);

    expect(mocks.addToCart).not.toHaveBeenCalled();
    expect(
      sessionStorage.getItem("pointclick_login_required_feedback")
    ).toContain("Login necessário");
  });

  it("exibe estado vazio quando nenhum produto é retornado", async () => {
    mocks.productService.findAll.mockResolvedValueOnce([]);

    render(<ProductsPage />);

    await waitFor(() => {
      expect(screen.getByText("Nenhum produto encontrado")).toBeInTheDocument();
    });
  });
});
