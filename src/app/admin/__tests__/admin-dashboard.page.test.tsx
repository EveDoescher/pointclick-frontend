import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AdminPage from "../page";

const dashboard = {
  totalOrders: 12,
  pendingOrders: 1,
  closedOrders: 2,
  paidOrders: 3,
  shippedOrders: 1,
  deliveredOrders: 1,
  finishedOrders: 4,
  cancelledOrders: 1,
  totalRevenue: 12500,
  activeProducts: 20,
  inactiveProducts: 2,
  outOfStockProducts: 1,
  lowStockProducts: 3,
  activeUsers: 30,
  inactiveUsers: 2,
  customerUsers: 28,
  adminUsers: 2,
};

const mocks = vi.hoisted(() => ({
  adminService: {
    getDashboard: vi.fn(),
  },
  couponService: {
    findAll: vi.fn(),
  },
  useFeedbackModal: vi.fn(),
  showError: vi.fn(),
}));

vi.mock("@/components/auth/AdminRoute", () => ({
  AdminRoute: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock("@/services/adminService", () => ({
  adminService: mocks.adminService,
}));

vi.mock("@/services/couponService", () => ({
  couponService: mocks.couponService,
}));

vi.mock("@/contexts/FeedbackModalContext", () => ({
  useFeedbackModal: mocks.useFeedbackModal,
}));

describe("AdminPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mocks.useFeedbackModal.mockReturnValue({
      showError: mocks.showError,
    });

    mocks.adminService.getDashboard.mockResolvedValue(dashboard);
    mocks.couponService.findAll.mockResolvedValue([
      {
        id: 1,
        code: "POINT10",
        description: "Cupom teste",
        discountType: "PERCENTAGE",
        discountValue: 10,
        minimumOrderValue: 100,
        active: true,
        startsAt: null,
        endsAt: null,
        usageLimit: null,
        usedCount: 2,
        currentlyValid: true,
        createdAt: "2026-05-01T10:00:00Z",
        updatedAt: "2026-05-01T10:00:00Z",
      },
    ]);
  });

  it("carrega dashboard administrativo", async () => {
    render(<AdminPage />);

    expect(screen.getByText("Painel administrativo")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("Fila operacional")).toBeInTheDocument();
    });

    expect(screen.getAllByText("Produtos").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Pedidos").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Usuários").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Cupons").length).toBeGreaterThan(0);
  });

  it("mostra erro ao falhar dashboard", async () => {
    mocks.adminService.getDashboard.mockRejectedValueOnce(new Error("Falha"));

    render(<AdminPage />);

    await waitFor(() => {
      expect(mocks.showError).toHaveBeenCalledWith(
        expect.any(Error),
        "Erro ao carregar dashboard"
      );
    });
  });
});
