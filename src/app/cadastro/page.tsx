"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Loader2,
  MapPin,
  PackageCheck,
  ShieldCheck,
  UserPlus,
  type LucideIcon,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useFeedbackModal } from "@/contexts/FeedbackModalContext";

export default function RegisterPage() {
  const router = useRouter();
  const { register, login } = useAuth();
  const { showError } = useFeedbackModal();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (password !== confirmPassword) {
      showError(new Error("As senhas não coincidem."), "Cadastro inválido");
      return;
    }

    if (password.length < 6) {
      showError(
        new Error("A senha deve ter pelo menos 6 caracteres."),
        "Cadastro inválido"
      );
      return;
    }

    setLoading(true);

    try {
      await register({
        fullName,
        email,
        password,
      });

      await login({
        email,
        password,
      });

      router.push("/");
    } catch (error) {
      showError(error, "Erro ao criar conta");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#FAFAF9] px-4 py-8 lg:px-8 lg:py-10">
      <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[.86fr_1.06fr]">
        <section className="flex min-h-[calc(100vh-5rem)] items-center lg:min-h-0">
          <div className="w-full rounded-[2rem] border border-stone-200 bg-white p-6 shadow-[0_20px_54px_rgba(41,37,36,0.06)] md:p-8">
            <div className="flex items-start justify-between gap-5 border-b border-stone-200 pb-7">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#8f6f2e]">
                  Cadastro
                </p>

                <h1 className="mt-3 font-[family-name:var(--font-rubik)] text-4xl font-semibold leading-[1.02] tracking-[-0.05em] text-stone-950">
                  Criar conta
                </h1>

                <p className="mt-3 max-w-sm text-sm leading-6 text-stone-500">
                  Comece com o essencial. Endereço e dados de entrega podem ser
                  preenchidos no checkout.
                </p>
              </div>

              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-stone-200 bg-[#fbfaf7] text-[#8f6f2e]">
                <UserPlus className="h-5 w-5" aria-hidden="true" />
              </div>
            </div>

            <form onSubmit={handleSubmit} className="mt-7 space-y-5">
              <label className="block">
                <span className="text-sm font-semibold text-stone-950">
                  Nome completo
                </span>
                <input
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  placeholder="Ana Souza"
                  required
                  autoComplete="name"
                  className="mt-2 h-12 w-full rounded-full border border-stone-200 bg-[#fbfaf7] px-4 text-sm font-medium text-stone-950 outline-none transition placeholder:text-stone-400 hover:border-stone-300 focus:border-[#d8c28f] focus:bg-white"
                />
              </label>

              <label className="block">
                <span className="text-sm font-semibold text-stone-950">
                  E-mail
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="ana@email.com"
                  required
                  autoComplete="email"
                  className="mt-2 h-12 w-full rounded-full border border-stone-200 bg-[#fbfaf7] px-4 text-sm font-medium text-stone-950 outline-none transition placeholder:text-stone-400 hover:border-stone-300 focus:border-[#d8c28f] focus:bg-white"
                />
              </label>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="block">
                  <span className="text-sm font-semibold text-stone-950">
                    Senha
                  </span>
                  <input
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    required
                    autoComplete="new-password"
                    className="mt-2 h-12 w-full rounded-full border border-stone-200 bg-[#fbfaf7] px-4 text-sm font-medium text-stone-950 outline-none transition placeholder:text-stone-400 hover:border-stone-300 focus:border-[#d8c28f] focus:bg-white"
                  />
                </label>

                <label className="block">
                  <span className="text-sm font-semibold text-stone-950">
                    Confirmar senha
                  </span>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    placeholder="Repita a senha"
                    required
                    autoComplete="new-password"
                    className="mt-2 h-12 w-full rounded-full border border-stone-200 bg-[#fbfaf7] px-4 text-sm font-medium text-stone-950 outline-none transition placeholder:text-stone-400 hover:border-stone-300 focus:border-[#d8c28f] focus:bg-white"
                  />
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#8f6f2e] px-5 text-sm font-semibold text-white transition hover:bg-[#76591f] disabled:cursor-not-allowed disabled:bg-stone-300"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    Criando conta
                  </>
                ) : (
                  <>
                    Criar conta
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-7 rounded-[1.5rem] border border-stone-200 bg-[#fbfaf7] p-5">
              <p className="text-sm text-stone-500">
                Já tem conta?{" "}
                <Link
                  href="/login"
                  className="font-bold text-[#8f6f2e] transition hover:text-[#76591f]"
                >
                  Entrar
                </Link>
              </p>
            </div>
          </div>
        </section>

        <section className="hidden overflow-hidden rounded-[2rem] border border-stone-200 bg-white shadow-[0_20px_54px_rgba(41,37,36,0.06)] lg:block">
          <div className="grid min-h-[680px] grid-rows-[1fr_auto]">
            <div className="relative bg-[#f1efea] p-10">
              <div className="absolute right-10 top-10 rounded-full border border-stone-200 bg-white/85 px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-[#8f6f2e] shadow-sm backdrop-blur">
                PointClick
              </div>

              <div className="relative z-10 max-w-2xl">
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#8f6f2e]">
                  Conta PointClick
                </p>

                <h2 className="mt-5 max-w-xl font-[family-name:var(--font-rubik)] text-5xl font-semibold leading-[0.98] tracking-[-0.055em] text-stone-950 xl:text-6xl">
                  Uma conta para comprar melhor.
                </h2>

                <p className="mt-6 max-w-lg text-base leading-8 text-stone-600">
                  Seu cadastro começa leve. As informações de entrega entram
                  quando forem necessárias para finalizar o pedido.
                </p>
              </div>

              <div className="absolute bottom-10 left-10 right-10">
                <div className="grid gap-4 xl:grid-cols-3">
                  <FeatureTile
                    icon={ShieldCheck}
                    title="Acesso seguro"
                    description="Dados protegidos na sua conta."
                  />
                  <FeatureTile
                    icon={MapPin}
                    title="Endereço depois"
                    description="Complete no checkout."
                  />
                  <FeatureTile
                    icon={PackageCheck}
                    title="Pedidos"
                    description="Acompanhe tudo pela conta."
                  />
                </div>
              </div>
            </div>

            <div className="border-t border-stone-200 bg-white p-7">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#8f6f2e]">
                Como funciona
              </p>

              <div className="mt-5 grid gap-3 md:grid-cols-4">
                <Step number="01" title="Crie a conta" />
                <Step number="02" title="Escolha produtos" />
                <Step number="03" title="Informe entrega" />
                <Step number="04" title="Acompanhe pedido" />
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

function Step({ number, title }: { number: string; title: string }) {
  return (
    <div className="rounded-[1.25rem] border border-stone-200 bg-[#fbfaf7] p-4">
      <div className="flex items-center gap-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#f4ead0] text-[11px] font-bold text-[#8f6f2e]">
          {number}
        </span>

        <p className="text-sm font-semibold text-stone-950">{title}</p>
      </div>
    </div>
  );
}