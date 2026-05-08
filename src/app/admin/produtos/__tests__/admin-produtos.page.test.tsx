import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AdminProductsPage from "../page";
import { productFixture } from "@/test/fixtures/productFixture";

const mocks = vi.hoisted(() => ({
  productService: {
    findAllForAdmin: vi.fn(),
    findAllCategoryGroupsForAdmin: vi.fn(),
    findAllCategoriesForAdmin: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    activate: vi.fn(),
    deactivate: vi.fn(),
  },
  uploadService: {
    uploadProductImage: vi.fn(),
  },
  useFeedbackModal: vi.fn(),
  showError: vi.fn(),
}));

vi.mock("@/components/auth/AdminRoute", () => ({
  AdminRoute: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock("@/services/productService", () => ({
  productService: mocks.productService,
}));

vi.mock("@/services/uploadService", () => ({
  uploadService: mocks.uploadService,
}));

vi.mock("@/contexts/FeedbackModalContext", () => ({
  useFeedbackModal: mocks.useFeedbackModal,
}));

describe("AdminProductsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mocks.useFeedbackModal.mockReturnValue({
      showError: mocks.showError,
    });

    mocks.productService.findAllForAdmin.mockResolvedValue([productFixture]);
    mocks.productService.findAllCategoryGroupsForAdmin.mockResolvedValue([
      "Computadores e Mobile",
    ]);
    mocks.productService.findAllCategoriesForAdmin.mockResolvedValue(["Notebook"]);
    mocks.productService.create.mockResolvedValue(productFixture);
    mocks.productService.update.mockResolvedValue(productFixture);
    mocks.productService.activate.mockResolvedValue(productFixture);
    mocks.productService.deactivate.mockResolvedValue(productFixture);
  });

  it("lista produtos administrativos", async () => {
    render(<AdminProductsPage />);

    expect(screen.getByText("Admin • Produtos")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("Notebook PointClick Pro")).toBeInTheDocument();
    });

    expect(screen.getByText("Produtos cadastrados")).toBeInTheDocument();
  });

  it("abre formulário de novo produto", async () => {
    const user = userEvent.setup();

    render(<AdminProductsPage />);

    await waitFor(() => {
      expect(screen.getByText("Notebook PointClick Pro")).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: "Novo produto" }));

    expect(screen.getAllByText("Cadastrar produto").length).toBeGreaterThan(0);
    expect(screen.getByText("Dados principais")).toBeInTheDocument();
  });

  it("filtra produto por busca", async () => {
    const user = userEvent.setup();

    render(<AdminProductsPage />);

    await waitFor(() => {
      expect(screen.getByText("Notebook PointClick Pro")).toBeInTheDocument();
    });

    await user.type(
      screen.getByPlaceholderText("Buscar produto, descrição ou marca"),
      "Notebook"
    );

    expect(screen.getByText("Notebook PointClick Pro")).toBeInTheDocument();
  });

  it("exibe estado vazio quando não há produtos", async () => {
    mocks.productService.findAllForAdmin.mockResolvedValueOnce([]);

    render(<AdminProductsPage />);

    await waitFor(() => {
      expect(screen.getByText(/Nenhum produto encontrado/i)).toBeInTheDocument();
    });
  });

  it("mostra erro ao falhar carregamento de produtos", async () => {
    mocks.productService.findAllForAdmin.mockRejectedValueOnce(new Error("Falha"));

    render(<AdminProductsPage />);

    await waitFor(() => {
      expect(mocks.showError).toHaveBeenCalledWith(
        expect.any(Error),
        "Erro ao carregar produtos"
      );
    });
  });

  it("abre formulário de edição do produto", async () => {
    const user = userEvent.setup();

    render(<AdminProductsPage />);

    await waitFor(() => {
      expect(screen.getByText("Notebook PointClick Pro")).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: "Editar" }));

    expect(screen.getByText("Editar produto")).toBeInTheDocument();
    expect(screen.getAllByText("Notebook PointClick Pro").length).toBeGreaterThan(1);
  });

  it("abre confirmação de ativação/desativação", async () => {
    const user = userEvent.setup();

    render(<AdminProductsPage />);

    await waitFor(() => {
      expect(screen.getByText("Notebook PointClick Pro")).toBeInTheDocument();
    });

    const toggleButton =
      screen.queryByRole("button", { name: "Desativar" }) ??
      screen.getByRole("button", { name: "Ativar" });

    await user.click(toggleButton);

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Desativar produto?")).toBeInTheDocument();
  });
});
