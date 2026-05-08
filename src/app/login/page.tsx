"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Heart,
  Loader2,
  LockKeyhole,
  PackageCheck,
  ShoppingBag,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useFeedbackModal } from "@/contexts/FeedbackModalContext";

const LOGIN_REDIRECT_PATH_KEY = "pointclick_login_redirect_path";
const LOGIN_REQUIRED_FEEDBACK_KEY = "pointclick_login_required_feedback";

type LoginRequiredFeedback = {
  title?: string;
  message?: string;
};

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const { showError, showInfo } = useFeedbackModal();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const rawFeedback = sessionStorage.getItem(LOGIN_REQUIRED_FEEDBACK_KEY);

      if (!rawFeedback) return;

      sessionStorage.removeItem(LOGIN_REQUIRED_FEEDBACK_KEY);

      const parsedFeedback = JSON.parse(rawFeedback) as LoginRequiredFeedback;

      if (parsedFeedback.message) {
        showInfo(
          parsedFeedback.message,
          parsedFeedback.title || "Login necessário",
        );
      }
    } catch {
      sessionStorage.removeItem(LOGIN_REQUIRED_FEEDBACK_KEY);
    }
  }, [showInfo]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);

    try {
      const response = await login({
        email,
        password,
      });

      const redirectPath = getPendingLoginRedirectPath();

      if (response.user.role === "ADMIN") {
        router.push("/admin");
      } else {
        router.push(redirectPath || "/");
      }
    } catch (error) {
      showError(error, "Erro ao entrar");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#FAFAF9] px-4 py-8 lg:px-8 lg:py-10">
      <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[1.05fr_.82fr]">
        <section className="hidden overflow-hidden rounded-[2rem] border border-stone-200 bg-white shadow-[0_20px_54px_rgba(41,37,36,0.06)] lg:block">
          <div className="grid min-h-[680px] grid-rows-[1fr_auto]">
            <div className="relative overflow-hidden bg-[#f1efea] p-10">
              <div className="absolute right-10 top-10 rounded-full border border-stone-200 bg-white/85 px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-[#8f6f2e] shadow-sm backdrop-blur">
                PointClick
              </div>

              <div className="relative z-10 max-w-2xl">
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#8f6f2e]">
                  Área do cliente
                </p>

                <h1 className="mt-5 max-w-xl font-[family-name:var(--font-rubik)] text-5xl font-semibold leading-[0.98] tracking-[-0.055em] text-stone-950 xl:text-6xl">
                  Entre para continuar sua compra.
                </h1>

                <p className="mt-6 max-w-lg text-base leading-8 text-stone-600">
                  Acesse sua conta para acompanhar pedidos, recuperar carrinho e
                  manter seus produtos favoritos em um só lugar.
                </p>
              </div>

              <div className="absolute bottom-10 left-10 right-10 grid gap-4 xl:grid-cols-3">
                <FeatureTile
                  icon={ShoppingBag}
                  title="Carrinho"
                  description="Continue de onde parou."
                />
                <FeatureTile
                  icon={PackageCheck}
                  title="Pedidos"
                  description="Acompanhe suas compras."
                />
                <FeatureTile
                  icon={Heart}
                  title="Favoritos"
                  description="Salve produtos para depois."
                />
              </div>
            </div>

            <div className="grid border-t border-stone-200 bg-white md:grid-cols-3">
              <EditorialMetric label="Conta" value="cliente" />
              <EditorialMetric label="Compra" value="segura" />
              <EditorialMetric label="Pedidos" value="rastreados" />
            </div>
          </div>
        </section>

        <section className="flex min-h-[calc(100vh-5rem)] items-center lg:min-h-0">
          <div className="w-full rounded-[2rem] border border-stone-200 bg-white p-6 shadow-[0_20px_54px_rgba(41,37,36,0.06)] md:p-8">
            <div className="flex items-start justify-between gap-5 border-b border-stone-200 pb-7">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#8f6f2e]">
                  Login
                </p>

                <h2 className="mt-3 font-[family-name:var(--font-rubik)] text-4xl font-semibold leading-[1.02] tracking-[-0.05em] text-stone-950">
                  Acessar conta
                </h2>

                <p className="mt-3 max-w-sm text-sm leading-6 text-stone-500">
                  Informe seus dados para continuar sua experiência na
                  PointClick.
                </p>
              </div>

              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-stone-200 bg-[#fbfaf7] text-[#8f6f2e]">
                <LockKeyhole className="h-5 w-5" aria-hidden="true" />
              </div>
            </div>

            <form onSubmit={handleSubmit} className="mt-7 space-y-5">
              <label className="block">
                <span className="text-sm font-semibold text-stone-950">
                  E-mail
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="voce@email.com"
                  required
                  autoComplete="email"
                  className="mt-2 h-12 w-full rounded-full border border-stone-200 bg-[#fbfaf7] px-4 text-sm font-medium text-stone-950 outline-none transition placeholder:text-stone-400 hover:border-stone-300 focus:border-[#d8c28f] focus:bg-white"
                />
              </label>

              <label className="block">
                <span className="text-sm font-semibold text-stone-950">
                  Senha
                </span>
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Sua senha"
                  required
                  autoComplete="current-password"
                  className="mt-2 h-12 w-full rounded-full border border-stone-200 bg-[#fbfaf7] px-4 text-sm font-medium text-stone-950 outline-none transition placeholder:text-stone-400 hover:border-stone-300 focus:border-[#d8c28f] focus:bg-white"
                />
              </label>

              <button
                type="submit"
                disabled={loading}
                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#8f6f2e] px-5 text-sm font-semibold text-white transition hover:bg-[#76591f] disabled:cursor-not-allowed disabled:bg-stone-300"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    Entrando
                  </>
                ) : (
                  <>
                    Entrar
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-7 rounded-[1.5rem] border border-stone-200 bg-[#fbfaf7] p-5">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-[#8f6f2e] ring-1 ring-stone-200">
                  <UserRound className="h-4 w-4" aria-hidden="true" />
                </div>

                <div>
                  <p className="text-sm font-semibold text-stone-950">
                    Ainda não tem conta?
                  </p>

                  <p className="mt-1 text-sm leading-6 text-stone-500">
                    Crie uma conta para salvar favoritos e acompanhar seus
                    pedidos.
                  </p>

                  <Link
                    href="/cadastro"
                    className="mt-3 inline-flex items-center gap-2 text-sm font-bold text-[#8f6f2e] transition hover:text-[#76591f]"
                  >
                    Criar conta
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function FeatureTile({
  icon: Icon,
  title,
  description,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-[1.5rem] border border-white/70 bg-white/78 p-5 shadow-sm backdrop-blur">
      <Icon className="h-5 w-5 text-[#8f6f2e]" aria-hidden="true" />
      <p className="mt-4 text-sm font-semibold text-stone-950">{title}</p>
      <p className="mt-2 text-sm leading-6 text-stone-500">{description}</p>
    </div>
  );
}

function EditorialMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-b border-stone-200 p-5 last:border-b-0 md:border-b-0 md:border-r md:last:border-r-0">
      <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-stone-500">
        {label}
      </p>
      <p className="mt-1 text-lg font-semibold tracking-[-0.025em] text-stone-950">
        {value}
      </p>
    </div>
  );
}

function getPendingLoginRedirectPath() {
  if (typeof window === "undefined") return null;

  try {
    const redirectPath = sessionStorage.getItem(LOGIN_REDIRECT_PATH_KEY);
    sessionStorage.removeItem(LOGIN_REDIRECT_PATH_KEY);

    if (!redirectPath || redirectPath === "/login") {
      return null;
    }

    return redirectPath;
  } catch {
    return null;
  }
}
