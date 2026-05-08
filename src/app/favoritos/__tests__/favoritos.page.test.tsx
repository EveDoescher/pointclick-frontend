import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import FavoritesPage from "../page";
import { productFixture } from "@/test/fixtures/productFixture";

const mocks = vi.hoisted(() => ({
  favoriteService: {
    findMyFavorites: vi.fn(),
  },
  useFeedbackModal: vi.fn(),
  showError: vi.fn(),
}));

vi.mock("@/components/auth/ProtectedRoute", () => ({
  ProtectedRoute: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock("@/components/products/ProductCard", () => ({
  ProductCard: ({ product }: { product: { name: string } }) => (
    <article data-testid="favorite-card">{product.name}</article>
  ),
}));

vi.mock("@/services/favoriteService", () => ({
  favoriteService: mocks.favoriteService,
}));

vi.mock("@/contexts/FeedbackModalContext", () => ({
  useFeedbackModal: mocks.useFeedbackModal,
}));

describe("FavoritesPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mocks.useFeedbackModal.mockReturnValue({
      showError: mocks.showError,
    });

    mocks.favoriteService.findMyFavorites.mockResolvedValue([
      {
        id: 1,
        userId: 1,
        product: productFixture,
        createdAt: "2026-05-01T10:00:00Z",
      },
    ]);
  });

  it("lista produtos favoritos", async () => {
    render(<FavoritesPage />);

    expect(screen.getByText("Favoritos")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("Notebook PointClick Pro")).toBeInTheDocument();
    });

    expect(screen.getByTestId("favorite-card")).toBeInTheDocument();
  });

  it("exibe estado vazio quando não há favoritos", async () => {
    mocks.favoriteService.findMyFavorites.mockResolvedValueOnce([]);

    render(<FavoritesPage />);

    await waitFor(() => {
      expect(screen.getByText("Nenhum favorito ainda")).toBeInTheDocument();
    });
  });

  it("mostra feedback de erro ao falhar carregamento", async () => {
    mocks.favoriteService.findMyFavorites.mockRejectedValueOnce(new Error("Falha"));

    render(<FavoritesPage />);

    await waitFor(() => {
      expect(mocks.showError).toHaveBeenCalledWith(
        expect.any(Error),
        "Erro ao carregar favoritos"
      );
    });
  });
});
