import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import NotificationsPage from "../page";

const notification = {
  id: 1,
  type: "PAYMENT_APPROVED" as const,
  title: "Pagamento aprovado",
  message: "Seu pedido foi aprovado.",
  linkUrl: "/pedidos/10",
  read: false,
  readAt: null,
  createdAt: "2026-05-01T10:00:00Z",
};

const mocks = vi.hoisted(() => ({
  notificationService: {
    findMyNotifications: vi.fn(),
    markAsRead: vi.fn(),
    markAllAsRead: vi.fn(),
    delete: vi.fn(),
  },
  useFeedbackModal: vi.fn(),
  showError: vi.fn(),
}));

vi.mock("@/components/auth/ProtectedRoute", () => ({
  ProtectedRoute: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock("@/services/notificationService", () => ({
  notificationService: mocks.notificationService,
}));

vi.mock("@/contexts/FeedbackModalContext", () => ({
  useFeedbackModal: mocks.useFeedbackModal,
}));

describe("NotificationsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mocks.useFeedbackModal.mockReturnValue({
      showError: mocks.showError,
    });

    mocks.notificationService.findMyNotifications.mockResolvedValue([notification]);
    mocks.notificationService.markAsRead.mockResolvedValue({
      ...notification,
      read: true,
      readAt: "2026-05-01T10:10:00Z",
    });
    mocks.notificationService.markAllAsRead.mockResolvedValue(undefined);
    mocks.notificationService.delete.mockResolvedValue(undefined);
  });

  it("lista notificações", async () => {
    render(<NotificationsPage />);

    expect(screen.getByText("Notificações")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getAllByText("Pagamento aprovado").length).toBeGreaterThan(0);
    });

    expect(screen.getByText("Seu pedido foi aprovado.")).toBeInTheDocument();
  });

  it("marca todas como lidas", async () => {
    const user = userEvent.setup();

    render(<NotificationsPage />);

    await waitFor(() => {
      expect(screen.getAllByText("Pagamento aprovado").length).toBeGreaterThan(0);
    });

    await user.click(screen.getByRole("button", { name: "Marcar todas como lidas" }));

    expect(mocks.notificationService.markAllAsRead).toHaveBeenCalled();
  });

  it("remove uma notificação", async () => {
    const user = userEvent.setup();

    render(<NotificationsPage />);

    await waitFor(() => {
      expect(screen.getAllByText("Pagamento aprovado").length).toBeGreaterThan(0);
    });

    await user.click(screen.getByRole("button", { name: "Remover" }));

    expect(mocks.notificationService.delete).toHaveBeenCalledWith(1);
  });

  it("exibe estado vazio", async () => {
    mocks.notificationService.findMyNotifications.mockResolvedValueOnce([]);

    render(<NotificationsPage />);

    await waitFor(() => {
      expect(screen.getByText("Nenhuma notificação")).toBeInTheDocument();
    });
  });
});
