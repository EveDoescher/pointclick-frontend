import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ProtectedRoute } from "../auth/ProtectedRoute";

const mocks = vi.hoisted(() => ({
  useAuth: vi.fn(),
}));

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: mocks.useAuth,
}));

describe("ProtectedRoute", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("mostra carregamento enquanto verifica sessão", () => {
    mocks.useAuth.mockReturnValue({
      isAuthenticated: false,
      loading: true,
    });

    render(
      <ProtectedRoute>
        <p>Conteúdo protegido</p>
      </ProtectedRoute>
    );

    expect(screen.getByText("Verificando sua sessão")).toBeInTheDocument();
  });

  it("mostra redirecionamento quando usuário não está autenticado", async () => {
    mocks.useAuth.mockReturnValue({
      isAuthenticated: false,
      loading: false,
    });

    render(
      <ProtectedRoute>
        <p>Conteúdo protegido</p>
      </ProtectedRoute>
    );

    await waitFor(() => {
      expect(screen.getByText("Redirecionando para o login")).toBeInTheDocument();
    });

    expect(screen.queryByText("Conteúdo protegido")).not.toBeInTheDocument();
  });

  it("renderiza children quando autenticado", () => {
    mocks.useAuth.mockReturnValue({
      isAuthenticated: true,
      loading: false,
    });

    render(
      <ProtectedRoute>
        <p>Conteúdo protegido</p>
      </ProtectedRoute>
    );

    expect(screen.getByText("Conteúdo protegido")).toBeInTheDocument();
  });
});
