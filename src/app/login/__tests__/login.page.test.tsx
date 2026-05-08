import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import LoginPage from "../page";
import {
  authenticatedAdminFixture,
  authenticatedCustomerFixture,
} from "@/test/fixtures/userFixture";

const mocks = vi.hoisted(() => ({
  useAuth: vi.fn(),
  login: vi.fn(),
  useFeedbackModal: vi.fn(),
  showError: vi.fn(),
  showInfo: vi.fn(),
}));

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: mocks.useAuth,
}));

vi.mock("@/contexts/FeedbackModalContext", () => ({
  useFeedbackModal: mocks.useFeedbackModal,
}));

describe("LoginPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mocks.useAuth.mockReturnValue({
      login: mocks.login,
    });

    mocks.useFeedbackModal.mockReturnValue({
      showError: mocks.showError,
      showInfo: mocks.showInfo,
    });

    mocks.login.mockResolvedValue({
      token: "token",
      refreshToken: "refresh",
      type: "Bearer",
      expiresIn: 3600,
      user: authenticatedCustomerFixture,
    });
  });

  it("renderiza formulário de login", () => {
    render(<LoginPage />);

    expect(screen.getByText("Entrar")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("voce@email.com")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Sua senha")).toBeInTheDocument();
  });

  it("envia credenciais para o contexto de autenticação", async () => {
    const user = userEvent.setup();

    render(<LoginPage />);

    await user.type(
      screen.getByPlaceholderText("voce@email.com"),
      "cliente@pointclick.com"
    );
    await user.type(screen.getByPlaceholderText("Sua senha"), "123456");
    await user.click(screen.getByRole("button", { name: /^Entrar$/ }));

    await waitFor(() => {
      expect(mocks.login).toHaveBeenCalledWith({
        email: "cliente@pointclick.com",
        password: "123456",
      });
    });
  });

  it("redireciona admin para dashboard", async () => {
    const user = userEvent.setup();

    mocks.login.mockResolvedValueOnce({
      token: "token",
      refreshToken: "refresh",
      type: "Bearer",
      expiresIn: 3600,
      user: authenticatedAdminFixture,
    });

    render(<LoginPage />);

    await user.type(
      screen.getByPlaceholderText("voce@email.com"),
      "admin@pointclick.com"
    );
    await user.type(screen.getByPlaceholderText("Sua senha"), "123456");
    await user.click(screen.getByRole("button", { name: /^Entrar$/ }));

    await waitFor(() => {
      expect(globalThis.__getNextNavigationMock?.().push).toHaveBeenCalledWith(
        "/admin"
      );
    });
  });

  it("exibe feedback vindo do sessionStorage quando login é obrigatório", async () => {
    sessionStorage.setItem(
      "pointclick_login_required_feedback",
      JSON.stringify({
        title: "Login necessário",
        message: "Entre para continuar.",
      })
    );

    render(<LoginPage />);

    await waitFor(() => {
      expect(mocks.showInfo).toHaveBeenCalledWith(
        "Entre para continuar.",
        "Login necessário"
      );
    });
  });

  it("mostra erro quando login falha", async () => {
    const user = userEvent.setup();

    mocks.login.mockRejectedValueOnce(new Error("Credenciais inválidas"));

    render(<LoginPage />);

    await user.type(
      screen.getByPlaceholderText("voce@email.com"),
      "cliente@pointclick.com"
    );
    await user.type(screen.getByPlaceholderText("Sua senha"), "errada");
    await user.click(screen.getByRole("button", { name: /^Entrar$/ }));

    await waitFor(() => {
      expect(mocks.showError).toHaveBeenCalledWith(
        expect.any(Error),
        "Erro ao entrar"
      );
    });
  });
});
