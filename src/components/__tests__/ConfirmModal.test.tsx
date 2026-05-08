import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ConfirmModal } from "../ui/ConfirmModal";

describe("ConfirmModal", () => {
  it("não renderiza quando fechado", () => {
    render(
      <ConfirmModal
        open={false}
        title="Remover item"
        message="Deseja continuar?"
        onConfirm={vi.fn()}
        onClose={vi.fn()}
      />
    );

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("renderiza título, mensagem e executa confirmação", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();

    render(
      <ConfirmModal
        open
        title="Remover item"
        message="Deseja continuar?"
        confirmLabel="Remover"
        onConfirm={onConfirm}
        onClose={vi.fn()}
      />
    );

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Remover item")).toBeInTheDocument();
    expect(screen.getByText("Deseja continuar?")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Remover" }));

    expect(onConfirm).toHaveBeenCalled();
  });

  it("executa fechamento ao clicar em cancelar", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    render(
      <ConfirmModal
        open
        title="Cancelar pedido"
        message="Deseja cancelar?"
        onConfirm={vi.fn()}
        onClose={onClose}
      />
    );

    await user.click(screen.getByRole("button", { name: "Cancelar" }));

    expect(onClose).toHaveBeenCalled();
  });

  it("mostra estado de carregamento", () => {
    render(
      <ConfirmModal
        open
        loading
        title="Processando"
        message="Aguarde."
        onConfirm={vi.fn()}
        onClose={vi.fn()}
      />
    );

    expect(screen.getByRole("button", { name: /processando/i })).toBeDisabled();
  });
});
