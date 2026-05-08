import { describe, expect, it } from "vitest";
import { ApiRequestError } from "@/services/api";
import {
  getErrorMessage,
  getErrorTitle,
  isForbiddenError,
  isUnauthorizedError,
  shouldShowErrorAsModal,
} from "../errorMessage";

function makeApiError(status: number, title: string, detail: string) {
  return new ApiRequestError({
    status,
    title,
    detail,
    timestamp: "2026-05-01T10:00:00Z",
  });
}

describe("errorMessage", () => {
  it("retorna mensagem amigável para erro comum", () => {
    expect(getErrorMessage(new Error("Erro de validação"))).toBe(
      "Erro de validação"
    );
  });

  it("substitui mensagens técnicas por mensagem segura", () => {
    expect(getErrorMessage(new Error("JDBC connection failed"))).toBe(
      "Ocorreu um erro interno. Tente novamente em instantes."
    );

    expect(getErrorMessage(new Error("java.lang.NullPointerException"))).toBe(
      "Ocorreu um erro interno. Tente novamente em instantes."
    );
  });

  it("retorna fallback para erro desconhecido", () => {
    expect(getErrorMessage(null)).toBe(
      "Ocorreu um erro inesperado. Tente novamente."
    );
  });

  it("extrai título de ApiRequestError", () => {
    const error = makeApiError(400, "Cadastro inválido", "E-mail inválido");

    expect(getErrorTitle(error)).toBe("Cadastro inválido");
    expect(getErrorMessage(error)).toBe("E-mail inválido");
  });

  it("identifica 401 e 403", () => {
    expect(isUnauthorizedError(makeApiError(401, "Unauthorized", "401"))).toBe(
      true
    );
    expect(isForbiddenError(makeApiError(403, "Forbidden", "403"))).toBe(true);
  });

  it("define quando erro deve aparecer como modal", () => {
    expect(shouldShowErrorAsModal(makeApiError(500, "Erro", "Erro"))).toBe(
      true
    );
    expect(shouldShowErrorAsModal(makeApiError(403, "Erro", "Erro"))).toBe(
      true
    );
    expect(shouldShowErrorAsModal(makeApiError(400, "Erro", "Erro"))).toBe(
      false
    );
    expect(shouldShowErrorAsModal(new Error("Erro comum"))).toBe(true);
  });
});
