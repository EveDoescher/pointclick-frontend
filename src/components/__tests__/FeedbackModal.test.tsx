import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import {
  FeedbackModalProvider,
  useFeedbackModal,
} from "@/contexts/FeedbackModalContext";
import { FeedbackModal } from "../ui/FeedbackModal";
import { renderWithProviders } from "@/test/test-utils";

function Trigger() {
  const { showError, showSuccess } = useFeedbackModal();

  return (
    <div>
      <button type="button" onClick={() => showSuccess("Salvo com sucesso.")}>
        sucesso
      </button>
      <button
        type="button"
        onClick={() => showError(new Error("Erro tratado"))}
      >
        erro
      </button>
    </div>
  );
}

function renderModal() {
  return renderWithProviders(
    <FeedbackModalProvider>
      <Trigger />
      <FeedbackModal />
    </FeedbackModalProvider>
  );
}

describe("FeedbackModal", () => {
  it("não renderiza quando fechado", () => {
    renderWithProviders(
      <FeedbackModalProvider>
        <FeedbackModal />
      </FeedbackModalProvider>
    );

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("renderiza feedback de sucesso", async () => {
    const user = userEvent.setup();

    renderModal();

    await user.click(screen.getByRole("button", { name: "sucesso" }));

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Salvo com sucesso.")).toBeInTheDocument();
  });

  it("fecha modal", async () => {
    const user = userEvent.setup();

    renderModal();

    await user.click(screen.getByRole("button", { name: "erro" }));
    expect(screen.getByText("Erro tratado")).toBeInTheDocument();

    await user.click(screen.getAllByRole("button", { name: /fechar/i })[0]);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
