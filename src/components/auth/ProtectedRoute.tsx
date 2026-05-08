"use client";

import { useEffect, type ReactNode } from "react";
import { Loader2, LockKeyhole } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

type ProtectedRouteProps = {
  children: ReactNode;
};

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const router = useRouter();
  const { isAuthenticated, loading } = useAuth();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [loading, isAuthenticated, router]);

  if (loading) {
    return <RouteLoading message="Verificando sua sessão" />;
  }

  if (!isAuthenticated) {
    return <RouteLoading message="Redirecionando para o login" />;
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
              <LockKeyhole className="h-6 w-6" aria-hidden="true" />
            </div>

            <p className="mt-6 text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--pc-purple)]">
              PointClick
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