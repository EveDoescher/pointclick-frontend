import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NotificationBell } from "../notifications/NotificationBell";

const mocks = vi.hoisted(() => ({
  useAuth: vi.fn(),
  useFeedbackModal: vi.fn(),
  showError: vi.fn(),
  notificationService: {
    countUnreadNotifications: vi.fn(),
    findMyNotifications: vi.fn(),
    markAsRead: vi.fn(),
    markAllAsRead: vi.fn(),
  },
}));

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: mocks.useAuth,
}));

vi.mock("@/contexts/FeedbackModalContext", () => ({
  useFeedbackModal: mocks.useFeedbackModal,
}));

vi.mock("@/services/notificationService", () => ({
  notificationService: mocks.notificationService,
}));

const notification = {
  id: 1,
  type: "PAYMENT_APPROVED" as const,
  title: "Pagamento aprovado",
  message: "Seu pedido foi aprovado.",
  linkUrl: null,
  read: false,
  readAt: null,
  createdAt: "2026-05-01T10:00:00Z",
};

describe("NotificationBell", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mocks.useFeedbackModal.mockReturnValue({
      showError: mocks.showError,
    });

    mocks.notificationService.countUnreadNotifications.mockResolvedValue(2);
    mocks.notificationService.findMyNotifications.mockResolvedValue([
      notification,
    ]);
    mocks.notificationService.markAsRead.mockResolvedValue({
      ...notification,
      read: true,
      readAt: "2026-05-01T10:10:00Z",
    });
    mocks.notificationService.markAllAsRead.mockResolvedValue(undefined);
  });

  it("não renderiza para usuário deslogado", () => {
    mocks.useAuth.mockReturnValue({
      isAuthenticated: false,
    });

    render(<NotificationBell />);

    expect(
      screen.queryByRole("button", { name: "Abrir notificações" })
    ).not.toBeInTheDocument();
  });

  it("carrega contador e lista notificações ao abrir", async () => {
    const user = userEvent.setup();

    mocks.useAuth.mockReturnValue({
      isAuthenticated: true,
    });

    render(<NotificationBell />);

    await waitFor(() => {
      expect(screen.getByText("2")).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: "Abrir notificações" }));

    await waitFor(() => {
      expect(screen.getByText("Pagamento aprovado")).toBeInTheDocument();
    });

    expect(mocks.notificationService.findMyNotifications).toHaveBeenCalledWith(
      false
    );
  });

  it("marca todas como lidas", async () => {
    const user = userEvent.setup();

    mocks.useAuth.mockReturnValue({
      isAuthenticated: true,
    });

    render(<NotificationBell />);

    await user.click(screen.getByRole("button", { name: "Abrir notificações" }));

    await waitFor(() => {
      expect(screen.getByText("Pagamento aprovado")).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: "Lidas" }));

    expect(mocks.notificationService.markAllAsRead).toHaveBeenCalled();
  });

  it("marca notificação individual como lida", async () => {
    const user = userEvent.setup();

    mocks.useAuth.mockReturnValue({
      isAuthenticated: true,
    });

    render(<NotificationBell />);

    await user.click(screen.getByRole("button", { name: "Abrir notificações" }));

    await waitFor(() => {
      expect(screen.getByText("Pagamento aprovado")).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: /pagamento aprovado/i }));

    expect(mocks.notificationService.markAsRead).toHaveBeenCalledWith(1);
  });
});
