import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import PaymentPage from "../page";

vi.mock("@/components/auth/ProtectedRoute", () => ({
  ProtectedRoute: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

describe("PaymentPage", () => {
  it("orienta usuário a escolher pedido para pagar", () => {
    render(<PaymentPage />);

    expect(screen.getByText("Escolha um pedido para pagar")).toBeInTheDocument();
    expect(screen.getByText("Ir para o carrinho")).toBeInTheDocument();
    expect(screen.getByText("Ver meus pedidos")).toBeInTheDocument();
  });
});
