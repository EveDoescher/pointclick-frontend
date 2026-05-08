"use client";

import {
  AlertTriangle,
  CheckCircle2,
  Info,
  X,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import { useFeedbackModal } from "@/contexts/FeedbackModalContext";

type FeedbackType = "success" | "error" | "warning" | "info";

const typeConfig: Record<
  FeedbackType,
  {
    label: string;
    Icon: LucideIcon;
    toneClass: string;
    iconClass: string;
  }
> = {
  success: {
    label: "Tudo certo",
    Icon: CheckCircle2,
    toneClass: "text-[var(--pc-green)]",
    iconClass: "bg-[var(--pc-green-soft)] text-[var(--pc-green)]",
  },
  error: {
    label: "Algo deu errado",
    Icon: XCircle,
    toneClass: "text-[var(--pc-danger)]",
    iconClass: "bg-[var(--pc-danger-soft)] text-[var(--pc-danger)]",
  },
  warning: {
    label: "Atenção",
    Icon: AlertTriangle,
    toneClass: "text-[var(--pc-warning)]",
    iconClass: "bg-[var(--pc-warning-soft)] text-[var(--pc-warning)]",
  },
  info: {
    label: "Informação",
    Icon: Info,
    toneClass: "text-[var(--pc-purple)]",
    iconClass: "bg-[var(--pc-purple-soft)] text-[var(--pc-purple)]",
  },
};

export function FeedbackModal() {
  const { feedback, closeFeedback } = useFeedbackModal();

  if (!feedback.open) return null;

  const config = typeConfig[feedback.type as FeedbackType] ?? typeConfig.info;
  const Icon = config.Icon;

  const shouldShowLabel =
    normalizeText(config.label) !== normalizeText(feedback.title);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#1f1b16]/25 px-4 backdrop-blur-[5px]">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="feedback-modal-title"
        className="w-full max-w-[440px] overflow-hidden rounded-[1.5rem] border border-[var(--pc-border)] bg-[#fffefa] shadow-[0_24px_70px_rgba(46,39,31,0.16)]"
      >
        <div className="p-6">
          <div className="flex items-start justify-between gap-5">
            <div className="flex min-w-0 items-start gap-4">
              <span
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${config.iconClass}`}
              >
                <Icon className="h-5 w-5" aria-hidden="true" />
              </span>

              <div className="min-w-0">
                {shouldShowLabel && (
                  <p
                    className={`text-[11px] font-bold uppercase tracking-[0.18em] ${config.toneClass}`}
                  >
                    {config.label}
                  </p>
                )}

                <h2
                  id="feedback-modal-title"
                  className={`text-2xl font-semibold leading-[1.08] tracking-[-0.04em] text-[var(--pc-text)] ${
                    shouldShowLabel ? "mt-2" : "mt-1"
                  }`}
                >
                  {feedback.title}
                </h2>
              </div>
            </div>

            <button
              type="button"
              onClick={closeFeedback}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[var(--pc-text-muted)] transition hover:bg-[#f1ede4] hover:text-[var(--pc-text)]"
              aria-label="Fechar aviso"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>

          <p className="mt-5 text-[0.96rem] leading-7 text-[var(--pc-text-soft)]">
            {feedback.message}
          </p>

          <div className="mt-6 flex justify-end">
            <button
              type="button"
              onClick={closeFeedback}
              className="inline-flex h-10 items-center justify-center rounded-full border border-[var(--pc-border)] bg-white px-5 text-sm font-semibold text-[var(--pc-text)] transition hover:border-[var(--pc-border-strong)] hover:bg-[#fbfaf7]"
            >
              Fechar
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

function normalizeText(value: string) {
  return value.trim().toLowerCase();
}