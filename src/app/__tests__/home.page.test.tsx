import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import HomePage from "../page";
import { makeProductFixture } from "@/test/fixtures/productFixture";

const mocks = vi.hoisted(() => ({
  productService: {
    findAll: vi.fn(),
  },
  useFeedbackModal: vi.fn(),
  showError: vi.fn(),
}));

vi.mock("@/services/productService", () => ({
  productService: mocks.productService,
}));

vi.mock("@/contexts/FeedbackModalContext", () => ({
  useFeedbackModal: mocks.useFeedbackModal,
}));

describe("HomePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mocks.useFeedbackModal.mockReturnValue({
      showError: mocks.showError,
    });

    mocks.productService.findAll.mockResolvedValue([
      makeProductFixture({
        id: 1,
        name: "Notebook PointClick Pro",
        brand: "PointClick",
        price: 4999.9,
      }),
      makeProductFixture({
        id: 2,
        name: "Headset Studio",
        brand: "AudioLab",
        price: 699.9,
      }),
    ]);
  });

  it("carrega a home e exibe produtos em destaque", async () => {
    render(<HomePage />);

    expect(
      screen.getByRole("heading", {
        name: /Curadoria de tecnologia para novos espaços/i,
      })
    ).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("Notebook PointClick Pro")).toBeInTheDocument();
    });

    expect(screen.getByText("Headset Studio")).toBeInTheDocument();
    expect(mocks.productService.findAll).toHaveBeenCalledWith({
      available: true,
      sort: "newest",
    });
  });

  it("exibe fallback quando não há produtos", async () => {
    mocks.productService.findAll.mockResolvedValueOnce([]);

    render(<HomePage />);

    await waitFor(() => {
      expect(screen.getByText("Nenhum produto disponível")).toBeInTheDocument();
    });

    expect(
      screen.getByText("Novos produtos aparecerão aqui assim que forem cadastrados.")
    ).toBeInTheDocument();
  });

  it("mostra erro amigável quando falha ao carregar produtos", async () => {
    mocks.productService.findAll.mockRejectedValueOnce(new Error("Falha"));

    render(<HomePage />);

    await waitFor(() => {
      expect(mocks.showError).toHaveBeenCalledWith(
        expect.any(Error),
        "Erro ao carregar produtos"
      );
    });
  });
});
