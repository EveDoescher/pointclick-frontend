import { render, type RenderOptions } from "@testing-library/react";
import type { ReactElement, ReactNode } from "react";
import { FeedbackModalProvider } from "@/contexts/FeedbackModalContext";

type ProvidersProps = {
  children: ReactNode;
};

function TestProviders({ children }: ProvidersProps) {
  return <FeedbackModalProvider>{children}</FeedbackModalProvider>;
}

export function renderWithProviders(
  ui: ReactElement,
  options?: Omit<RenderOptions, "wrapper">
) {
  return render(ui, {
    wrapper: TestProviders,
    ...options,
  });
}
