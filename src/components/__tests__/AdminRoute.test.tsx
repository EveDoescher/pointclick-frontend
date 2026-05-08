import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AdminRoute } from "../auth/AdminRoute";

const mocks = vi.hoisted(() => ({
  useAuth: vi.fn(),
}));

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: mocks.useAuth,
}));

describe("AdminRoute", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("mostra carregamento enquanto verifica permissões", () => {
    mocks.useAuth.mockReturnValue({
      isAuthenticated: false,
      isAdmin: false,
      loading: true,
    });

    render(
      <AdminRoute>
        <p>Área admin</p>
      </AdminRoute>
    );

    expect(screen.getByText("Verificando permissões")).toBeInTheDocument();
  });

  it("mostra redirecionamento para login quando não autenticado", () => {
    mocks.useAuth.mockReturnValue({
      isAuthenticated: false,
      isAdmin: false,
      loading: false,
    });

    render(
      <AdminRoute>
        <p>Área admin</p>
      </AdminRoute>
    );

    expect(screen.getByText("Redirecionando para o login")).toBeInTheDocument();
  });

  it("bloqueia cliente comum", () => {
    mocks.useAuth.mockReturnValue({
      isAuthenticated: true,
      isAdmin: false,
      loading: false,
    });

    render(
      <AdminRoute>
        <p>Área admin</p>
      </AdminRoute>
    );

    expect(screen.getByText("Acesso negado")).toBeInTheDocument();
    expect(screen.queryByText("Área admin")).not.toBeInTheDocument();
  });

  it("renderiza conteúdo para admin", () => {
    mocks.useAuth.mockReturnValue({
      isAuthenticated: true,
      isAdmin: true,
      loading: false,
    });

    render(
      <AdminRoute>
        <p>Área admin</p>
      </AdminRoute>
    );

    expect(screen.getByText("Área admin")).toBeInTheDocument();
  });
});
