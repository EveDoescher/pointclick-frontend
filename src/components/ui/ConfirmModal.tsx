"use client";

import type { ReactNode } from "react";
import {
  AlertTriangle,
  CircleHelp,
  Loader2,
  X,
  type LucideIcon,
} from "lucide-react";

type ConfirmModalProps = {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
  danger?: boolean;
  children?: ReactNode;
  onConfirm: () => void | Promise<void>;
  onClose: () => void;
};

export function ConfirmModal({
  open,
  title,
  message,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  loading = false,
  danger = false,
  children,
  onConfirm,
  onClose,
}: ConfirmModalProps) {
  if (!open) return null;

  const Icon = danger ? AlertTriangle : CircleHelp;

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-[#1f1b16]/30 px-4 backdrop-blur-[6px]">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-modal-title"
        className="w-full max-w-[520px] overflow-hidden rounded-[1.35rem] border border-[var(--pc-border)] bg-[#fffefa] shadow-[0_28px_80px_rgba(46,39,31,0.16)]"
      >
        <div className="flex items-center justify-between border-b border-[var(--pc-border)] px-6 py-4">
          <div className="flex items-center gap-3">
            <StatusIcon Icon={Icon} danger={danger} />

            <p
              className={`text-[11px] font-bold uppercase tracking-[0.18em] ${
                danger ? "text-[var(--pc-danger)]" : "text-[var(--pc-purple)]"
              }`}
            >
              {danger ? "Ação sensível" : "Confirmação"}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="flex h-9 w-9 items-center justify-center rounded-full text-[var(--pc-text-muted)] transition hover:bg-[#f1ede4] hover:text-[var(--pc-text)] disabled:cursor-not-allowed disabled:opacity-60"
            aria-label="Fechar"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <div className="px-6 py-7">
          <h2
            id="confirm-modal-title"
            className="max-w-[420px] text-[1.85rem] font-semibold leading-[1.05] tracking-[-0.045em] text-[var(--pc-text)]"
          >
            {title}
          </h2>

          <p className="mt-4 max-w-[440px] text-[0.98rem] leading-7 text-[var(--pc-text-muted)]">
            {message}
          </p>

          {children && (
            <div className="mt-6 rounded-[1.15rem] border border-[var(--pc-border)] bg-[#fbfaf7] p-4 text-[var(--pc-text-soft)]">
              {children}
            </div>
          )}
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-[var(--pc-border)] bg-[#fbfaf7] px-6 py-5 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="inline-flex h-11 items-center justify-center rounded-full border border-[var(--pc-border)] bg-white px-5 text-sm font-semibold text-[var(--pc-text)] transition hover:border-[var(--pc-border-strong)] hover:bg-[#f6f2e9] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {cancelLabel}
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`inline-flex h-11 items-center justify-center gap-2 rounded-full px-5 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-60 ${
              danger
                ? "bg-[var(--pc-danger)] hover:bg-[var(--pc-danger-hover)]"
                : "bg-[var(--pc-purple)] hover:bg-[var(--pc-purple-hover)]"
            }`}
          >
            {loading && (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            )}
            {loading ? "Processando..." : confirmLabel}
          </button>
        </div>
      </section>
    </div>
  );
}

function StatusIcon({
  Icon,
  danger,
}: {
  Icon: LucideIcon;
  danger: boolean;
}) {
  return (
    <span
      className={`flex h-9 w-9 items-center justify-center rounded-full ${
        danger
          ? "bg-[var(--pc-danger-soft)] text-[var(--pc-danger)]"
          : "bg-[var(--pc-purple-soft)] text-[var(--pc-purple)]"
      }`}
    >
      <Icon className="h-4.5 w-4.5" aria-hidden="true" />
    </span>
  );
}