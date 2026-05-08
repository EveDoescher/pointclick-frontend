"use client";

import Link from "next/link";
import { CreditCard } from "lucide-react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

export default function PaymentPage() {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-[#FAFAF9] px-4 py-12 lg:px-8">
        <div className="mx-auto max-w-3xl rounded-[2rem] border border-stone-200 bg-white p-10 text-center shadow-[0_10px_28px_rgba(28,25,23,0.06)]">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[1.75rem] border border-stone-200 bg-[#fbfaf7] text-[var(--pc-purple)]">
            <CreditCard className="h-9 w-9" aria-hidden="true" />
          </div>

          <p className="mt-7 text-[11px] font-bold uppercase tracking-[0.2em] text-amber-800">
            Pagamento
          </p>

          <h1 className="mt-3 font-[family-name:var(--font-rubik)] text-3xl font-semibold tracking-[-0.04em] text-stone-900">
            Escolha um pedido para pagar
          </h1>

          <p className="mt-4 leading-7 text-stone-600">
            Feche o carrinho para gerar um pedido ou abra um pedido aguardando
            pagamento na sua lista.
          </p>

          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            <Link
              href="/carrinho"
              className="inline-flex items-center justify-center rounded-full border border-[var(--pc-purple)] bg-[var(--pc-purple)] px-5 py-4 text-sm font-semibold text-white shadow-sm transition hover:bg-[var(--pc-purple-hover)]"
            >
              Ir para o carrinho
            </Link>

            <Link
              href="/pedidos"
              className="inline-flex items-center justify-center rounded-full border border-stone-300 bg-white px-5 py-4 text-sm font-semibold text-stone-800 transition hover:border-amber-500/45"
            >
              Ver meus pedidos
            </Link>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
