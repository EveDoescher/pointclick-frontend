import { ApiRequestError } from "@/services/api";

export function getErrorMessage(error: unknown): string {
  if (error instanceof ApiRequestError) {
    return sanitizeMessage(error.detail || error.title);
  }

  if (error instanceof Error) {
    return sanitizeMessage(error.message);
  }

  return "Ocorreu um erro inesperado. Tente novamente.";
}

export function getErrorTitle(error: unknown): string {
  if (error instanceof ApiRequestError) {
    return error.title || "Erro";
  }

  return "Erro";
}

export function isUnauthorizedError(error: unknown): boolean {
  return error instanceof ApiRequestError && error.status === 401;
}

export function isForbiddenError(error: unknown): boolean {
  return error instanceof ApiRequestError && error.status === 403;
}

export function shouldShowErrorAsModal(error: unknown): boolean {
  if (!(error instanceof ApiRequestError)) {
    return true;
  }

  return error.status >= 500 || error.status === 403 || error.status === 401;
}

function sanitizeMessage(message: string | null | undefined): string {
  if (!message || !message.trim()) {
    return "Ocorreu um erro inesperado. Tente novamente.";
  }

  const lowerMessage = message.toLowerCase();

  const looksTechnical =
    lowerMessage.includes("jdbc") ||
    lowerMessage.includes("sql") ||
    lowerMessage.includes("hibernate") ||
    lowerMessage.includes("stack trace") ||
    lowerMessage.includes("nullpointerexception") ||
    lowerMessage.includes("org.springframework") ||
    lowerMessage.includes("java.") ||
    lowerMessage.includes("function ") ||
    lowerMessage.includes("does not exist");

  if (looksTechnical) {
    return "Ocorreu um erro interno. Tente novamente em instantes.";
  }

  return message.trim();
}