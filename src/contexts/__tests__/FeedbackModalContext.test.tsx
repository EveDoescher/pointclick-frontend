import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import {
  FeedbackModalProvider,
  useFeedbackModal,
} from "../FeedbackModalContext";
import { renderWithProviders } from "@/test/test-utils";
import { FeedbackModal } from "@/components/ui/FeedbackModal";

function FeedbackConsumer() {
  const { showSuccess, showError, showWarning, showInfo } = useFeedbackModal();

  return (
    <div>
      <button type="button" onClick={() => showSuccess("Operação concluída.")}>
        sucesso
      </button>
      <button
        type="button"
        onClick={() => showError(new Error("Falha controlada"))}
      >
        erro
      </button>
      <button
        type="button"
        onClick={() => showWarning("Verifique os dados.")}
      >
        aviso
      </button>
      <button type="button" onClick={() => showInfo("Mensagem informativa.")}>
        info
      </button>
    </div>
  );
}

function renderFeedbackContext() {
  return renderWithProviders(
    <FeedbackModalProvider>
      <FeedbackConsumer />
      <FeedbackModal />
    </FeedbackModalProvider>
  );
}

describe("FeedbackModalContext", () => {
  it("exibe feedback de sucesso", async () => {
    const user = userEvent.setup();

    renderFeedbackContext();

    await user.click(screen.getByRole("button", { name: "sucesso" }));

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Tudo certo")).toBeInTheDocument();
    expect(screen.getByText("Operação concluída.")).toBeInTheDocument();
  });

  it("exibe feedback de erro usando Error", async () => {
    const user = userEvent.setup();

    renderFeedbackContext();

    await user.click(screen.getByRole("button", { name: "erro" }));

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Erro")).toBeInTheDocument();
    expect(screen.getByText("Falha controlada")).toBeInTheDocument();
  });

  it("fecha feedback ao clicar em fechar", async () => {
    const user = userEvent.setup();

    renderFeedbackContext();

    await user.click(screen.getByRole("button", { name: "info" }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    await user.click(screen.getAllByRole("button", { name: /fechar/i })[0]);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("exibe feedback de aviso", async () => {
    const user = userEvent.setup();

    renderFeedbackContext();

    await user.click(screen.getByRole("button", { name: "aviso" }));

    expect(screen.getByText("Atenção")).toBeInTheDocument();
    expect(screen.getByText("Verifique os dados.")).toBeInTheDocument();
  });
});
