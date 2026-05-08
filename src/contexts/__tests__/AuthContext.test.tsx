import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthProvider, useAuth } from "../AuthContext";
import {
  authenticatedCustomerFixture,
  userProfileFixture,
} from "@/test/fixtures/userFixture";

const mocks = vi.hoisted(() => ({
  authService: {
    login: vi.fn(),
    refresh: vi.fn(),
    logout: vi.fn(),
    me: vi.fn(),
    getStoredUser: vi.fn(),
    clearSession: vi.fn(),
  },
  userService: {
    create: vi.fn(),
    findMe: vi.fn(),
  },
  getStoredUser: vi.fn(),
}));

vi.mock("@/services/authService", () => ({
  authService: mocks.authService,
}));

vi.mock("@/services/userService", () => ({
  userService: mocks.userService,
}));

vi.mock("@/services/api", () => ({
  getStoredUser: mocks.getStoredUser,
}));

function AuthConsumer() {
  const {
    user,
    profile,
    isAuthenticated,
    isAdmin,
    isCustomer,
    loading,
    login,
    register,
    logout,
    refreshUser,
    refreshProfile,
  } = useAuth();

  return (
    <div>
      <p data-testid="loading">{String(loading)}</p>
      <p data-testid="authenticated">{String(isAuthenticated)}</p>
      <p data-testid="role">
        {isAdmin ? "admin" : isCustomer ? "customer" : "none"}
      </p>
      <p data-testid="user-name">{user?.fullName ?? "sem usuario"}</p>
      <p data-testid="profile-name">{profile?.fullName ?? "sem perfil"}</p>

      <button
        type="button"
        onClick={() =>
          login({
            email: "cliente@pointclick.com",
            password: "123456",
          })
        }
      >
        login
      </button>

      <button
        type="button"
        onClick={() =>
          register({
            fullName: "Cliente Novo",
            email: "novo@pointclick.com",
            password: "123456",
          })
        }
      >
        registrar
      </button>

      <button type="button" onClick={() => logout()}>
        sair
      </button>

      <button type="button" onClick={() => refreshUser()}>
        atualizar usuário
      </button>

      <button type="button" onClick={() => refreshProfile()}>
        atualizar perfil
      </button>
    </div>
  );
}

function renderAuthProvider() {
  return render(
    <AuthProvider>
      <AuthConsumer />
    </AuthProvider>
  );
}

describe("AuthContext", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getStoredUser.mockReturnValue(null);
    mocks.authService.me.mockResolvedValue(authenticatedCustomerFixture);
    mocks.userService.findMe.mockResolvedValue(userProfileFixture);
  });

  it("inicializa sem usuário quando não existe sessão salva", async () => {
    renderAuthProvider();

    await waitFor(() => {
      expect(screen.getByTestId("loading")).toHaveTextContent("false");
    });

    expect(screen.getByTestId("authenticated")).toHaveTextContent("false");
    expect(screen.getByTestId("user-name")).toHaveTextContent("sem usuario");
  });

  it("carrega usuário salvo e busca perfil completo no bootstrap", async () => {
    mocks.getStoredUser.mockReturnValue(authenticatedCustomerFixture);

    renderAuthProvider();

    await waitFor(() => {
      expect(screen.getByTestId("authenticated")).toHaveTextContent("true");
    });

    expect(mocks.authService.me).toHaveBeenCalled();
    expect(mocks.userService.findMe).toHaveBeenCalled();
    expect(screen.getByTestId("user-name")).toHaveTextContent(
      authenticatedCustomerFixture.fullName
    );
    expect(screen.getByTestId("profile-name")).toHaveTextContent(
      userProfileFixture.fullName
    );
  });

  it("realiza login e atualiza usuário/perfil", async () => {
    const user = userEvent.setup();

    mocks.authService.login.mockResolvedValue({
      token: "token",
      refreshToken: "refresh",
      type: "Bearer",
      expiresIn: 3600,
      user: authenticatedCustomerFixture,
    });

    renderAuthProvider();

    await waitFor(() => {
      expect(screen.getByTestId("loading")).toHaveTextContent("false");
    });

    await user.click(screen.getByRole("button", { name: "login" }));

    await waitFor(() => {
      expect(screen.getByTestId("authenticated")).toHaveTextContent("true");
    });

    expect(mocks.authService.login).toHaveBeenCalledWith({
      email: "cliente@pointclick.com",
      password: "123456",
    });
    expect(screen.getByTestId("profile-name")).toHaveTextContent(
      userProfileFixture.fullName
    );
  });

  it("registra novo usuário", async () => {
    const user = userEvent.setup();

    mocks.userService.create.mockResolvedValue(userProfileFixture);

    renderAuthProvider();

    await waitFor(() => {
      expect(screen.getByTestId("loading")).toHaveTextContent("false");
    });

    await user.click(screen.getByRole("button", { name: "registrar" }));

    expect(mocks.userService.create).toHaveBeenCalledWith({
      fullName: "Cliente Novo",
      email: "novo@pointclick.com",
      password: "123456",
    });
  });

  it("limpa sessão no logout", async () => {
    const user = userEvent.setup();

    mocks.getStoredUser.mockReturnValue(authenticatedCustomerFixture);
    mocks.authService.logout.mockResolvedValue(undefined);

    renderAuthProvider();

    await waitFor(() => {
      expect(screen.getByTestId("authenticated")).toHaveTextContent("true");
    });

    await act(async () => {
      await user.click(screen.getByRole("button", { name: "sair" }));
    });

    expect(mocks.authService.logout).toHaveBeenCalled();
    expect(screen.getByTestId("authenticated")).toHaveTextContent("false");
  });
});
