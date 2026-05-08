import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Header } from "../layout/Header";
import {
  authenticatedAdminFixture,
  authenticatedCustomerFixture,
  userProfileFixture,
} from "@/test/fixtures/userFixture";

const mocks = vi.hoisted(() => ({
  useAuth: vi.fn(),
  useCart: vi.fn(),
  logout: vi.fn(),
}));

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: mocks.useAuth,
}));

vi.mock("@/contexts/CartContext", () => ({
  useCart: mocks.useCart,
}));

vi.mock("@/components/notifications/NotificationBell", () => ({
  NotificationBell: () => <div data-testid="notification-bell" />,
}));

vi.mock("@/components/cart/CartToast", () => ({
  CartToast: () => <div data-testid="cart-toast" />,
}));

describe("Header", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mocks.useCart.mockReturnValue({
      cartCount: 3,
    });

    mocks.useAuth.mockReturnValue({
      user: null,
      profile: null,
      isAuthenticated: false,
      isAdmin: false,
      logout: mocks.logout,
    });
  });

  it("renderiza identidade, busca e ações para visitante", () => {
    render(<Header />);

    expect(screen.getByText("POINTCLICK")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Buscar produtos")).toBeInTheDocument();
    expect(screen.getByText("Entrar")).toBeInTheDocument();
    expect(screen.getByText("Criar conta")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
  });

  it("abre menu mobile", async () => {
    const user = userEvent.setup();

    render(<Header />);

    await user.click(screen.getByRole("button", { name: "Abrir menu" }));

    expect(screen.getByText("Loja")).toBeInTheDocument();
    expect(screen.getAllByText("Início").length).toBeGreaterThan(0);
  });

  it("abre menu da conta para usuário autenticado", async () => {
    const user = userEvent.setup();

    mocks.useAuth.mockReturnValue({
      user: authenticatedCustomerFixture,
      profile: userProfileFixture,
      isAuthenticated: true,
      isAdmin: false,
      logout: mocks.logout,
    });

    render(<Header />);

    await user.click(screen.getByRole("button", { name: "Abrir menu da conta" }));

    expect(screen.getByText(userProfileFixture.email)).toBeInTheDocument();
    expect(screen.getByText("Meus pedidos")).toBeInTheDocument();
    expect(screen.getByText("Favoritos")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Sair" }));

    expect(mocks.logout).toHaveBeenCalled();
  });

  it("mostra links administrativos para admin", async () => {
    const user = userEvent.setup();

    mocks.useAuth.mockReturnValue({
      user: authenticatedAdminFixture,
      profile: {
        ...userProfileFixture,
        ...authenticatedAdminFixture,
      },
      isAuthenticated: true,
      isAdmin: true,
      logout: mocks.logout,
    });

    render(<Header />);

    await user.click(screen.getByRole("button", { name: "Abrir menu da conta" }));

    expect(screen.getByText("Admin")).toBeInTheDocument();
    expect(screen.getByText("Administração")).toBeInTheDocument();
    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(screen.getByText("Cupons")).toBeInTheDocument();
  });

  it("redireciona busca preenchida para catálogo com query", async () => {
    const user = userEvent.setup();

    render(<Header />);

    await user.type(screen.getByLabelText("Buscar produtos"), "notebook gamer");
    await user.keyboard("{Enter}");

    expect(globalThis.__getNextNavigationMock?.().push).toHaveBeenCalledWith(
      "/produtos?search=notebook%20gamer"
    );
  });

  it("redireciona busca vazia para catálogo sem query", async () => {
    const user = userEvent.setup();

    render(<Header />);

    await user.click(screen.getByLabelText("Buscar produtos"));
    await user.keyboard("{Enter}");

    expect(globalThis.__getNextNavigationMock?.().push).toHaveBeenCalledWith(
      "/produtos"
    );
  });

  it("limpa termo digitado na busca", async () => {
    const user = userEvent.setup();

    render(<Header />);

    const input = screen.getByLabelText("Buscar produtos");

    await user.type(input, "mouse");
    expect(input).toHaveValue("mouse");

    await user.click(screen.getByRole("button", { name: "Limpar busca" }));

    expect(input).toHaveValue("");
  });

  it("mostra 9+ quando carrinho passa de nove itens", () => {
    mocks.useCart.mockReturnValue({
      cartCount: 12,
    });

    render(<Header />);

    expect(screen.getByText("9+")).toBeInTheDocument();
  });

  it("não mostra contador quando carrinho está vazio", () => {
    mocks.useCart.mockReturnValue({
      cartCount: 0,
    });

    render(<Header />);

    const cartLink = screen.getByRole("link", { name: "Abrir carrinho" });

    expect(within(cartLink).queryByText("0")).not.toBeInTheDocument();
  });

  it("mantém termo inicial de busca vindo da URL", () => {
    globalThis.__setNextNavigationMock?.({
      pathname: "/produtos",
      searchParams: { search: "teclado" },
    });

    render(<Header />);

    expect(screen.getByLabelText("Buscar produtos")).toHaveValue("teclado");
  });
});
