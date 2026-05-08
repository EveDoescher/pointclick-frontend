import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import RegisterPage from "../page";
import { authenticatedCustomerFixture } from "@/test/fixtures/userFixture";

const mocks = vi.hoisted(() => ({
  useAuth: vi.fn(),
  register: vi.fn(),
  login: vi.fn(),
  useFeedbackModal: vi.fn(),
  showError: vi.fn(),
}));

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: mocks.useAuth,
}));

vi.mock("@/contexts/FeedbackModalContext", () => ({
  useFeedbackModal: mocks.useFeedbackModal,
}));

describe("RegisterPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mocks.useAuth.mockReturnValue({
      register: mocks.register,
      login: mocks.login,
    });

    mocks.useFeedbackModal.mockReturnValue({
      showError: mocks.showError,
    });

    mocks.register.mockResolvedValue(authenticatedCustomerFixture);
    mocks.login.mockResolvedValue({
      token: "token",
      refreshToken: "refresh",
      type: "Bearer",
      expiresIn: 3600,
      user: authenticatedCustomerFixture,
    });
  });

  it("renderiza formulário de cadastro", () => {
    render(<RegisterPage />);

    expect(screen.getAllByText("Criar conta").length).toBeGreaterThan(0);
    expect(screen.getByPlaceholderText("Ana Souza")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("ana@email.com")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Mínimo 6 caracteres")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Repita a senha")).toBeInTheDocument();
  });

  it("valida senhas diferentes antes de chamar API", async () => {
    const user = userEvent.setup();

    render(<RegisterPage />);

    await user.type(screen.getByPlaceholderText("Ana Souza"), "Ana Souza");
    await user.type(screen.getByPlaceholderText("ana@email.com"), "ana@email.com");
    await user.type(screen.getByPlaceholderText("Mínimo 6 caracteres"), "123456");
    await user.type(screen.getByPlaceholderText("Repita a senha"), "654321");
    await user.click(screen.getByRole("button", { name: /^Criar conta$/ }));

    expect(mocks.register).not.toHaveBeenCalled();
    expect(mocks.showError).toHaveBeenCalledWith(
      expect.any(Error),
      "Cadastro inválido"
    );
  });

  it("valida senha curta", async () => {
    const user = userEvent.setup();

    render(<RegisterPage />);

    await user.type(screen.getByPlaceholderText("Ana Souza"), "Ana Souza");
    await user.type(screen.getByPlaceholderText("ana@email.com"), "ana@email.com");
    await user.type(screen.getByPlaceholderText("Mínimo 6 caracteres"), "123");
    await user.type(screen.getByPlaceholderText("Repita a senha"), "123");
    await user.click(screen.getByRole("button", { name: /^Criar conta$/ }));

    expect(mocks.register).not.toHaveBeenCalled();
    expect(mocks.showError).toHaveBeenCalledWith(
      expect.any(Error),
      "Cadastro inválido"
    );
  });

  it("cria conta, faz login e redireciona para home", async () => {
    const user = userEvent.setup();

    render(<RegisterPage />);

    await user.type(screen.getByPlaceholderText("Ana Souza"), "Ana Souza");
    await user.type(screen.getByPlaceholderText("ana@email.com"), "ana@email.com");
    await user.type(screen.getByPlaceholderText("Mínimo 6 caracteres"), "123456");
    await user.type(screen.getByPlaceholderText("Repita a senha"), "123456");
    await user.click(screen.getByRole("button", { name: /^Criar conta$/ }));

    await waitFor(() => {
      expect(mocks.register).toHaveBeenCalledWith({
        fullName: "Ana Souza",
        email: "ana@email.com",
        password: "123456",
      });
    });

    expect(mocks.login).toHaveBeenCalledWith({
      email: "ana@email.com",
      password: "123456",
    });
    expect(globalThis.__getNextNavigationMock?.().push).toHaveBeenCalledWith("/");
  });
});
