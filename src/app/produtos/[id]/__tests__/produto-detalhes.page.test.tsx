import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ProductDetailsPage from "../page";
import {
  makeProductFixture,
  productFixture,
} from "@/test/fixtures/productFixture";
import { userProfileFixture } from "@/test/fixtures/userFixture";

const mocks = vi.hoisted(() => ({
  productService: {
    findById: vi.fn(),
    findRelated: vi.fn(),
  },
  reviewService: {
    getSummaryByProductId: vi.fn(),
    findByProductId: vi.fn(),
  },
  favoriteService: {
    existsForCurrentUser: vi.fn(),
    addFavorite: vi.fn(),
    removeFavorite: vi.fn(),
  },
  addressService: {
    quoteByCep: vi.fn(),
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

vi.mock("@/services/reviewService", () => ({
  reviewService: mocks.reviewService,
}));

vi.mock("@/services/favoriteService", () => ({
  favoriteService: mocks.favoriteService,
}));

vi.mock("@/services/addressService", () => ({
  addressService: mocks.addressService,
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

describe("ProductDetailsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    globalThis.__setNextNavigationMock?.({
      params: { id: "1" },
      pathname: "/produtos/1",
    });

    mocks.useAuth.mockReturnValue({
      isAuthenticated: true,
      profile: userProfileFixture,
    });

    mocks.useCart.mockReturnValue({
      addToCart: mocks.addToCart,
      actionLoading: false,
    });

    mocks.useFeedbackModal.mockReturnValue({
      showError: mocks.showError,
      showInfo: mocks.showInfo,
    });

    mocks.productService.findById.mockResolvedValue(productFixture);
    mocks.productService.findRelated.mockResolvedValue([
      makeProductFixture({
        id: 2,
        name: "Produto relacionado",
      }),
    ]);
    mocks.reviewService.getSummaryByProductId.mockResolvedValue({
      averageRating: 4.5,
      totalReviews: 2,
      fiveStars: 1,
      fourStars: 1,
      threeStars: 0,
      twoStars: 0,
      oneStar: 0,
      withComments: 1,
      withMedia: 0,
    });
    mocks.reviewService.findByProductId.mockResolvedValue([]);
    mocks.favoriteService.existsForCurrentUser.mockResolvedValue(false);
    mocks.favoriteService.addFavorite.mockResolvedValue({});
    mocks.favoriteService.removeFavorite.mockResolvedValue(undefined);
    mocks.addressService.quoteByCep.mockResolvedValue({
      cep: "13480000",
      shippingPrice: 25,
      estimatedDays: 3,
      street: "Rua Teste",
      district: "Centro",
      city: "Limeira",
      state: "SP",
    });
    mocks.addToCart.mockResolvedValue({});
  });

  it("carrega e exibe detalhes do produto", async () => {
    render(<ProductDetailsPage />);

    await waitFor(() => {
      expect(screen.getByText("Notebook PointClick Pro")).toBeInTheDocument();
    });

    expect(screen.getByText("Sobre o produto")).toBeInTheDocument();
    expect(screen.getByText("Opiniões de clientes")).toBeInTheDocument();
    expect(mocks.productService.findById).toHaveBeenCalledWith(1);
  });

  it("adiciona produto ao carrinho", async () => {
    const user = userEvent.setup();

    render(<ProductDetailsPage />);

    await waitFor(() => {
      expect(screen.getByText("Notebook PointClick Pro")).toBeInTheDocument();
    });

    await user.click(
      screen.getByRole("button", { name: /adicionar ao carrinho/i })
    );

    expect(mocks.addToCart).toHaveBeenCalledWith(productFixture, 1);
  });

  it("calcula frete pelo CEP", async () => {
    const user = userEvent.setup();

    render(<ProductDetailsPage />);

    await waitFor(() => {
      expect(screen.getByText("Notebook PointClick Pro")).toBeInTheDocument();
    });

    await user.clear(screen.getByPlaceholderText("Digite seu CEP"));
    await user.type(screen.getByPlaceholderText("Digite seu CEP"), "13480000");
    await user.click(screen.getByRole("button", { name: "Calcular" }));

    await waitFor(() => {
      expect(mocks.addressService.quoteByCep).toHaveBeenCalledWith("13480000");
    });

    expect(screen.getByText("Limeira, SP")).toBeInTheDocument();
  });

  it("redireciona para login ao favoritar sem autenticação", async () => {
    const user = userEvent.setup();

    mocks.useAuth.mockReturnValue({
      isAuthenticated: false,
      profile: null,
    });

    render(<ProductDetailsPage />);

    await waitFor(() => {
      expect(screen.getByText("Notebook PointClick Pro")).toBeInTheDocument();
    });

    const favoriteButtons = screen.getAllByRole("button", {
      name: "Adicionar aos favoritos",
    });

    await user.click(favoriteButtons[0]);

    expect(
      sessionStorage.getItem("pointclick_login_required_feedback")
    ).toContain("Login necessário");
  });
});
