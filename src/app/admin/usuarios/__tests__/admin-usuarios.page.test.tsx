import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AdminUsersPage from "../page";
import { userProfileFixture } from "@/test/fixtures/userFixture";

const users = [
  userProfileFixture,
  {
    ...userProfileFixture,
    id: 2,
    fullName: "Admin PointClick",
    email: "admin@pointclick.com",
    role: "ADMIN" as const,
  },
];

const mocks = vi.hoisted(() => ({
  userService: {
    findAllForAdmin: vi.fn(),
    delete: vi.fn(),
    reactivate: vi.fn(),
  },
  useFeedbackModal: vi.fn(),
  showError: vi.fn(),
}));

vi.mock("@/components/auth/AdminRoute", () => ({
  AdminRoute: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock("@/services/userService", () => ({
  userService: mocks.userService,
}));

vi.mock("@/contexts/FeedbackModalContext", () => ({
  useFeedbackModal: mocks.useFeedbackModal,
}));

describe("AdminUsersPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mocks.useFeedbackModal.mockReturnValue({
      showError: mocks.showError,
    });

    mocks.userService.findAllForAdmin.mockResolvedValue(users);
    mocks.userService.delete.mockResolvedValue(undefined);
    mocks.userService.reactivate.mockResolvedValue(undefined);
  });

  it("lista usuários administrativos", async () => {
    render(<AdminUsersPage />);

    expect(screen.getByText("Admin • Usuários")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("Cliente PointClick")).toBeInTheDocument();
    });

    expect(screen.getByText("Admin PointClick")).toBeInTheDocument();
  });

  it("filtra usuário por busca", async () => {
    const user = userEvent.setup();

    render(<AdminUsersPage />);

    await waitFor(() => {
      expect(screen.getByText("Cliente PointClick")).toBeInTheDocument();
    });

    await user.type(screen.getByPlaceholderText("Buscar usuário"), "admin");

    expect(screen.getByText("Admin PointClick")).toBeInTheDocument();
  });

  it("abre modal de desativação", async () => {
    const user = userEvent.setup();

    render(<AdminUsersPage />);

    await waitFor(() => {
      expect(screen.getByText("Cliente PointClick")).toBeInTheDocument();
    });

    await user.click(screen.getAllByRole("button", { name: "Desativar" })[0]);

    expect(screen.getByText("Desativar usuário?")).toBeInTheDocument();
  });
});
