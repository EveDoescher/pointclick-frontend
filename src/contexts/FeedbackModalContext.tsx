"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { getErrorMessage, getErrorTitle } from "@/utils/errorMessage";

export type FeedbackType = "success" | "error" | "warning" | "info";

export type FeedbackModalState = {
  open: boolean;
  type: FeedbackType;
  title: string;
  message: string;
};

type ShowFeedbackInput = {
  type?: FeedbackType;
  title?: string;
  message: string;
};

type FeedbackModalContextValue = {
  feedback: FeedbackModalState;
  showFeedback: (input: ShowFeedbackInput) => void;
  showSuccess: (message: string, title?: string) => void;
  showError: (error: unknown, fallbackTitle?: string) => void;
  showWarning: (message: string, title?: string) => void;
  showInfo: (message: string, title?: string) => void;
  closeFeedback: () => void;
};

const DEFAULT_FEEDBACK: FeedbackModalState = {
  open: false,
  type: "info",
  title: "",
  message: "",
};

const FeedbackModalContext = createContext<FeedbackModalContextValue | null>(
  null
);

type FeedbackModalProviderProps = {
  children: ReactNode;
};

export function FeedbackModalProvider({ children }: FeedbackModalProviderProps) {
  const [feedback, setFeedback] =
    useState<FeedbackModalState>(DEFAULT_FEEDBACK);

  const showFeedback = useCallback((input: ShowFeedbackInput) => {
    setFeedback({
      open: true,
      type: input.type ?? "info",
      title: input.title ?? getDefaultTitle(input.type ?? "info"),
      message: input.message,
    });
  }, []);

  const showSuccess = useCallback(
    (message: string, title: string = "Tudo certo") => {
      showFeedback({
        type: "success",
        title,
        message,
      });
    },
    [showFeedback]
  );

  const showError = useCallback(
    (error: unknown, fallbackTitle?: string) => {
      showFeedback({
        type: "error",
        title: fallbackTitle ?? getErrorTitle(error),
        message: getErrorMessage(error),
      });
    },
    [showFeedback]
  );

  const showWarning = useCallback(
    (message: string, title: string = "Atenção") => {
      showFeedback({
        type: "warning",
        title,
        message,
      });
    },
    [showFeedback]
  );

  const showInfo = useCallback(
    (message: string, title: string = "Informação") => {
      showFeedback({
        type: "info",
        title,
        message,
      });
    },
    [showFeedback]
  );

  const closeFeedback = useCallback(() => {
    setFeedback((current) => ({
      ...current,
      open: false,
    }));
  }, []);

  const value = useMemo<FeedbackModalContextValue>(
    () => ({
      feedback,
      showFeedback,
      showSuccess,
      showError,
      showWarning,
      showInfo,
      closeFeedback,
    }),
    [
      feedback,
      showFeedback,
      showSuccess,
      showError,
      showWarning,
      showInfo,
      closeFeedback,
    ]
  );

  return (
    <FeedbackModalContext.Provider value={value}>
      {children}
    </FeedbackModalContext.Provider>
  );
}

export function useFeedbackModal(): FeedbackModalContextValue {
  const context = useContext(FeedbackModalContext);

  if (!context) {
    throw new Error(
      "useFeedbackModal deve ser usado dentro de FeedbackModalProvider"
    );
  }

  return context;
}

function getDefaultTitle(type: FeedbackType): string {
  switch (type) {
    case "success":
      return "Tudo certo";
    case "error":
      return "Erro";
    case "warning":
      return "Atenção";
    case "info":
    default:
      return "Informação";
  }
}