"use client";

import { useEffect, type ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, ShieldAlert, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

type AdminRouteProps = {
  children: ReactNode;
};

export function AdminRoute({ children }: AdminRouteProps) {
  const router = useRouter();
  const { isAuthenticated, isAdmin, loading } = useAuth();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [loading, isAuthenticated, router]);

  if (loading) {
    return <RouteLoading message="Verificando permissões" />;
  }

  if (!isAuthenticated) {
    return <RouteLoading message="Redirecionando para o login" />;
  }

  if (!isAdmin) {
    return (
      <main className="min-h-screen bg-[#f8f7f3] px-4 py-16">
        <div className="mx-auto flex min-h-[60vh] max-w-xl items-center justify-center">
          <div className="w-full rounded-[1.65rem] bg-gradient-to-br from-[rgba(180,35,24,0.28)] via-[rgba(222,215,202,0.88)] to-white p-px shadow-[0_24px_70px_rgba(46,39,31,0.12)]">
            <div className="rounded-[1.6rem] bg-white/95 p-8 text-center backdrop-blur-xl">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[var(--pc-danger-soft)] text-[var(--pc-danger)] ring-1 ring-[rgba(180,35,24,0.18)]">
                <ShieldAlert className="h-6 w-6" aria-hidden="true" />
              </div>

              <p className="mt-6 text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--pc-danger)]">
                Área administrativa
              </p>

              <h1 className="mt-2 text-3xl font-semibold tracking-[-0.045em] text-[var(--pc-text)]">
                Acesso negado
              </h1>

              <p className="mx-auto mt-3 max-w-md leading-7 text-[var(--pc-text-muted)]">
                Esta área é exclusiva para administradores da PointClick.
              </p>

              <Link
                href="/"
                className="mt-7 inline-flex h-11 items-center justify-center gap-2 rounded-full border border-[var(--pc-border)] bg-white px-5 text-sm font-semibold text-[var(--pc-text)] transition hover:border-[var(--pc-border-strong)] hover:bg-[#fbfaf7]"
              >
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                Voltar para a loja
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return <>{children}</>;
}

function RouteLoading({ message }: { message: string }) {
  return (
    <main className="min-h-screen bg-[#f8f7f3] px-4 py-16">
      <div className="mx-auto flex min-h-[60vh] max-w-xl items-center justify-center">
        <div className="w-full rounded-[1.65rem] bg-gradient-to-br from-[rgba(176,141,68,0.42)] via-[rgba(222,215,202,0.9)] to-white p-px shadow-[0_24px_70px_rgba(46,39,31,0.12)]">
          <div className="rounded-[1.6rem] bg-white/95 p-8 text-center backdrop-blur-xl">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#f1ede4] text-[var(--pc-text)] ring-1 ring-[rgba(201,190,172,0.55)]">
              <ShieldCheck className="h-6 w-6" aria-hidden="true" />
            </div>

            <p className="mt-6 text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--pc-purple)]">
              PointClick Admin
            </p>

            <h1 className="mt-2 text-2xl font-semibold tracking-[-0.035em] text-[var(--pc-text)]">
              {message}
            </h1>

            <div className="mt-6 flex items-center justify-center gap-2 text-sm font-medium text-[var(--pc-text-muted)]">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              Aguarde um instante
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}