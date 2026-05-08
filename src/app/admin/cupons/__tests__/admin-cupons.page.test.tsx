import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AdminCouponsPage from "../page";

const coupon = {
  id: 1,
  code: "POINT10",
  description: "Cupom de boas-vindas",
  discountType: "PERCENTAGE" as const,
  discountValue: 10,
  minimumOrderValue: 100,
  active: true,
  startsAt: null,
  endsAt: null,
  usageLimit: 100,
  usedCount: 2,
  currentlyValid: true,
  createdAt: "2026-05-01T10:00:00Z",
  updatedAt: "2026-05-01T10:00:00Z",
};

const mocks = vi.hoisted(() => ({
  couponService: {
    findAll: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    activate: vi.fn(),
    deactivate: vi.fn(),
  },
  useFeedbackModal: vi.fn(),
  showError: vi.fn(),
}));

vi.mock("@/components/auth/AdminRoute", () => ({
  AdminRoute: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock("@/services/couponService", () => ({
  couponService: mocks.couponService,
}));

vi.mock("@/contexts/FeedbackModalContext", () => ({
  useFeedbackModal: mocks.useFeedbackModal,
}));

describe("AdminCouponsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mocks.useFeedbackModal.mockReturnValue({
      showError: mocks.showError,
    });

    mocks.couponService.findAll.mockResolvedValue([coupon]);
    mocks.couponService.create.mockResolvedValue(coupon);
    mocks.couponService.update.mockResolvedValue(coupon);
    mocks.couponService.activate.mockResolvedValue(coupon);
    mocks.couponService.deactivate.mockResolvedValue(coupon);
  });

  it("lista cupons administrativos", async () => {
    render(<AdminCouponsPage />);

    expect(screen.getByText("Admin • Cupons")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("POINT10")).toBeInTheDocument();
    });

    expect(screen.getByText("Cupons cadastrados")).toBeInTheDocument();
  });

  it("abre formulário de novo cupom", async () => {
    const user = userEvent.setup();

    render(<AdminCouponsPage />);

    await waitFor(() => {
      expect(screen.getByText("POINT10")).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: "Novo cupom" }));

    expect(screen.getAllByText("Cadastrar cupom").length).toBeGreaterThan(0);
    expect(screen.getByText("Identificação")).toBeInTheDocument();
  });

  it("filtra cupom por busca", async () => {
    const user = userEvent.setup();

    render(<AdminCouponsPage />);

    await waitFor(() => {
      expect(screen.getByText("POINT10")).toBeInTheDocument();
    });

    await user.type(screen.getByPlaceholderText("Buscar cupom"), "POINT");

    expect(screen.getByText("POINT10")).toBeInTheDocument();
  });

  it("exibe estado vazio quando não há cupons", async () => {
    mocks.couponService.findAll.mockResolvedValueOnce([]);

    render(<AdminCouponsPage />);

    await waitFor(() => {
      expect(screen.getByText(/Nenhum cupom encontrado/i)).toBeInTheDocument();
    });
  });

  it("mostra erro ao falhar carregamento de cupons", async () => {
    mocks.couponService.findAll.mockRejectedValueOnce(new Error("Falha"));

    render(<AdminCouponsPage />);

    await waitFor(() => {
      expect(mocks.showError).toHaveBeenCalledWith(
        expect.any(Error),
        "Erro ao carregar cupons"
      );
    });
  });

  it("abre formulário de edição do cupom", async () => {
    const user = userEvent.setup();

    render(<AdminCouponsPage />);

    await waitFor(() => {
      expect(screen.getByText("POINT10")).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: "Editar" }));

    expect(screen.getByText("Editar cupom")).toBeInTheDocument();
    expect(screen.getByDisplayValue("POINT10")).toBeInTheDocument();
  });

  it("abre confirmação de ativação/desativação", async () => {
    const user = userEvent.setup();

    render(<AdminCouponsPage />);

    await waitFor(() => {
      expect(screen.getByText("POINT10")).toBeInTheDocument();
    });

    const toggleButton =
      screen.queryByRole("button", { name: "Desativar" }) ??
      screen.getByRole("button", { name: "Ativar" });

    await user.click(toggleButton);

    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });
});
