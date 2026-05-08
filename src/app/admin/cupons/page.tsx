"use client";

import {
  Suspense,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
  type InputHTMLAttributes,
  type ReactNode,
} from "react";
import Link from "next/link";
import {
  ArrowLeft,
  BadgePercent,
  CalendarClock,
  CheckCircle2,
  Clock,
  Edit3,
  Gift,
  Loader2,
  Plus,
  Power,
  PowerOff,
  Search,
  SlidersHorizontal,
  TicketPercent,
  WalletCards,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import { AdminRoute } from "@/components/auth/AdminRoute";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import type {
  CouponResponse,
  CreateCouponRequest,
  DiscountType,
} from "@/types/coupon";
import { DISCOUNT_TYPE_LABELS } from "@/types/coupon";
import { couponService } from "@/services/couponService";
import { useFeedbackModal } from "@/contexts/FeedbackModalContext";
import { formatCurrency, formatDateTime } from "@/utils/formatters";

type ActiveFilter = "" | "true" | "false";
type ValidityFilter = "" | "valid" | "scheduled" | "expired" | "exhausted";
type CouponToToggle = {
  coupon: CouponResponse;
  action: "DEACTIVATE" | "ACTIVATE";
};

type CouponFormState = {
  code: string;
  description: string;
  discountType: DiscountType;
  discountValue: string;
  minimumOrderValue: string;
  active: boolean;
  startsAt: string;
  endsAt: string;
  usageLimit: string;
};

const initialForm: CouponFormState = {
  code: "",
  description: "",
  discountType: "PERCENTAGE",
  discountValue: "",
  minimumOrderValue: "",
  active: true,
  startsAt: "",
  endsAt: "",
  usageLimit: "",
};

const validityOptions: { value: ValidityFilter; label: string }[] = [
  { value: "", label: "Todas as validades" },
  { value: "valid", label: "Válidos agora" },
  { value: "scheduled", label: "Agendados" },
  { value: "expired", label: "Expirados" },
  { value: "exhausted", label: "Limite atingido" },
];

export default function AdminCouponsPage() {
  return (
    <Suspense fallback={<AdminCouponsPageFallback />}>
      <AdminRoute>
        <AdminCouponsContent />
      </AdminRoute>
    </Suspense>
  );
}

function AdminCouponsPageFallback() {
  return (
    <main className="min-h-screen bg-[#f8f7f3] px-4 py-8 lg:px-8 lg:py-10">
      <div className="mx-auto max-w-7xl">
        <div className="rounded-[2rem] border border-stone-200 bg-white p-8 shadow-[0_20px_54px_rgba(41,37,36,0.06)]">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#8f6f2e]">
            Admin • Cupons
          </p>

          <h1 className="mt-4 text-3xl font-semibold tracking-[-0.04em] text-stone-950">
            Carregando cupons...
          </h1>

          <div className="mt-8 space-y-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="h-16 animate-pulse rounded-[1.25rem] bg-stone-100"
              />
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}

function AdminCouponsContent() {
  const { showError } = useFeedbackModal();

  const [coupons, setCoupons] = useState<CouponResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [formOpen, setFormOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<CouponResponse | null>(
    null
  );
  const [couponToToggle, setCouponToToggle] = useState<CouponToToggle | null>(
    null
  );

  const [form, setForm] = useState<CouponFormState>(initialForm);

  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>("");
  const [validityFilter, setValidityFilter] = useState<ValidityFilter>("");
  const [discountTypeFilter, setDiscountTypeFilter] = useState<
    "" | DiscountType
  >("");

  const filteredCoupons = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return coupons.filter((coupon) => {
      const matchesSearch =
        !normalizedSearch ||
        [coupon.code, coupon.description ?? "", coupon.discountType]
          .join(" ")
          .toLowerCase()
          .includes(normalizedSearch);

      const matchesDiscountType =
        !discountTypeFilter || coupon.discountType === discountTypeFilter;

      const matchesValidity =
        !validityFilter ||
        (validityFilter === "valid" && isCouponValidNow(coupon)) ||
        (validityFilter === "scheduled" && isCouponScheduled(coupon)) ||
        (validityFilter === "expired" && isCouponExpired(coupon)) ||
        (validityFilter === "exhausted" && isCouponExhausted(coupon));

      return matchesSearch && matchesDiscountType && matchesValidity;
    });
  }, [coupons, search, validityFilter, discountTypeFilter]);

  const stats = useMemo(() => {
    return {
      total: coupons.length,
      active: coupons.filter((coupon) => coupon.active).length,
      validNow: coupons.filter(isCouponValidNow).length,
      scheduled: coupons.filter(isCouponScheduled).length,
      expired: coupons.filter(isCouponExpired).length,
      exhausted: coupons.filter(isCouponExhausted).length,
    };
  }, [coupons]);

  const urgentCoupons = useMemo(() => {
    return coupons
      .filter((coupon) => isCouponExpired(coupon) || isCouponExhausted(coupon))
      .slice(0, 3);
  }, [coupons]);

  useEffect(() => {
    loadCoupons();
  }, [activeFilter]);

  async function loadCoupons() {
    setLoading(true);

    try {
      const active = activeFilter === "" ? null : activeFilter === "true";
      const response = await couponService.findAll(active);

      setCoupons(response);
    } catch (error) {
      showError(error, "Erro ao carregar cupons");
    } finally {
      setLoading(false);
    }
  }

  function updateForm<K extends keyof CouponFormState>(
    key: K,
    value: CouponFormState[K]
  ) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function openCreateForm() {
    setEditingCoupon(null);
    setForm(initialForm);
    setFormOpen(true);
  }

  function openEditForm(coupon: CouponResponse) {
    setEditingCoupon(coupon);
    setForm({
      code: coupon.code,
      description: coupon.description ?? "",
      discountType: coupon.discountType,
      discountValue: String(coupon.discountValue),
      minimumOrderValue:
        coupon.minimumOrderValue != null ? String(coupon.minimumOrderValue) : "",
      active: coupon.active,
      startsAt: toDateTimeInputValue(coupon.startsAt),
      endsAt: toDateTimeInputValue(coupon.endsAt),
      usageLimit: coupon.usageLimit != null ? String(coupon.usageLimit) : "",
    });
    setFormOpen(true);
  }

  function closeForm() {
    if (saving) return;

    setFormOpen(false);
    setEditingCoupon(null);
    setForm(initialForm);
  }

  function clearFilters() {
    setSearch("");
    setActiveFilter("");
    setValidityFilter("");
    setDiscountTypeFilter("");
  }

  function buildRequest(): CreateCouponRequest {
    const code = form.code.trim().toUpperCase();
    const discountValue = parseDecimal(form.discountValue);
    const minimumOrderValue =
      form.minimumOrderValue.trim() === ""
        ? null
        : parseDecimal(form.minimumOrderValue);

    const usageLimit =
      form.usageLimit.trim() === "" ? null : Number.parseInt(form.usageLimit, 10);

    if (!code) {
      throw new Error("Informe o código do cupom.");
    }

    if (!Number.isFinite(discountValue) || discountValue <= 0) {
      throw new Error("Informe um valor de desconto válido.");
    }

    if (form.discountType === "PERCENTAGE" && discountValue > 100) {
      throw new Error("Desconto percentual não pode ser maior que 100%.");
    }

    if (
      minimumOrderValue !== null &&
      (!Number.isFinite(minimumOrderValue) || minimumOrderValue < 0)
    ) {
      throw new Error("Informe um pedido mínimo válido.");
    }

    if (
      usageLimit !== null &&
      (!Number.isFinite(usageLimit) || usageLimit < 1)
    ) {
      throw new Error("Informe um limite de uso válido.");
    }

    if (form.startsAt && form.endsAt) {
      const startsAt = new Date(form.startsAt).getTime();
      const endsAt = new Date(form.endsAt).getTime();

      if (Number.isFinite(startsAt) && Number.isFinite(endsAt) && endsAt < startsAt) {
        throw new Error("A data final não pode ser anterior à data inicial.");
      }
    }

    return {
      code,
      description: form.description.trim() || null,
      discountType: form.discountType,
      discountValue,
      minimumOrderValue,
      active: form.active,
      startsAt: form.startsAt || null,
      endsAt: form.endsAt || null,
      usageLimit,
    };
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setSaving(true);

    try {
      const request = buildRequest();

      if (editingCoupon) {
        await couponService.update(editingCoupon.id, request);
      } else {
        await couponService.create(request);
      }

      closeForm();
      await loadCoupons();
    } catch (error) {
      showError(
        error,
        editingCoupon ? "Erro ao atualizar cupom" : "Erro ao criar cupom"
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleCoupon() {
    if (!couponToToggle) return;

    setSaving(true);

    try {
      if (couponToToggle.action === "DEACTIVATE") {
        await couponService.deactivate(couponToToggle.coupon.id);
      } else {
        await couponService.activate(couponToToggle.coupon.id);
      }

      setCouponToToggle(null);
      await loadCoupons();
    } catch (error) {
      showError(error, "Erro ao alterar status do cupom");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f8f7f3] px-4 py-8 lg:px-8 lg:py-10">
      <div className="mx-auto max-w-7xl">
        <Link
          href="/admin"
          className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-stone-600 transition hover:text-stone-950"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Voltar ao painel administrativo
        </Link>
        <section className="overflow-hidden rounded-[2rem] border border-stone-200 bg-white shadow-[0_20px_54px_rgba(41,37,36,0.06)]">
          <div className="grid gap-0 xl:grid-cols-[1fr_390px]">
            <div className="p-6 md:p-8">
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#8f6f2e]">
                Admin • Cupons
              </p>

              <div className="mt-4 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
                <div>
                  <h1 className="max-w-3xl text-4xl font-semibold leading-[1.02] tracking-[-0.05em] text-stone-950 md:text-5xl">
                    Cupons e campanhas
                  </h1>

                  <p className="mt-4 max-w-2xl text-base leading-7 text-stone-600">
                    Crie campanhas promocionais, acompanhe uso, validade e
                    disponibilidade dos cupons aplicados no checkout.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={openCreateForm}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-[#8f6f2e] px-5 text-sm font-semibold text-white transition hover:bg-[#76591f]"
                >
                  <Plus className="h-4 w-4" aria-hidden="true" />
                  Novo cupom
                </button>
              </div>

              <div className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                <StatCard label="Total" value={stats.total} icon={TicketPercent} />
                <StatCard label="Ativos" value={stats.active} icon={CheckCircle2} />
                <StatCard
                  label="Válidos agora"
                  value={stats.validNow}
                  icon={BadgePercent}
                  tone="premium"
                />
                <StatCard
                  label="Agendados"
                  value={stats.scheduled}
                  icon={CalendarClock}
                />
                <StatCard
                  label="Indisponíveis"
                  value={stats.expired + stats.exhausted}
                  icon={XCircle}
                  tone={stats.expired + stats.exhausted > 0 ? "danger" : "neutral"}
                />
              </div>
            </div>

            <aside className="border-t border-stone-200 bg-[#fbfaf7] p-6 xl:border-l xl:border-t-0 md:p-8">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#8f6f2e]">
                Operação
              </p>

              <h2 className="mt-3 text-2xl font-semibold tracking-[-0.035em] text-stone-950">
                Campanhas que pedem atenção
              </h2>

              <p className="mt-3 text-sm leading-6 text-stone-600">
                Cupons expirados ou com limite atingido aparecem aqui para
                revisão rápida.
              </p>

              <div className="mt-6 space-y-3">
                {urgentCoupons.length === 0 ? (
                  <div className="rounded-[1.5rem] border border-stone-200 bg-white p-5">
                    <div className="flex items-start gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--pc-green-soft)] text-[var(--pc-green)]">
                        <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                      </div>

                      <div>
                        <p className="text-sm font-semibold text-stone-950">
                          Campanhas sob controle
                        </p>
                        <p className="mt-1 text-sm leading-6 text-stone-500">
                          Nenhum cupom expirado ou esgotado nesta visualização.
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  urgentCoupons.map((coupon) => (
                    <UrgentCouponItem key={coupon.id} coupon={coupon} />
                  ))
                )}
              </div>
            </aside>
          </div>
        </section>

        <section className="mt-6 rounded-[2rem] border border-stone-200 bg-white p-5 shadow-[0_20px_54px_rgba(41,37,36,0.04)] md:p-6">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-stone-200 bg-[#fbfaf7] text-[#8f6f2e]">
              <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
            </div>

            <div>
              <p className="text-sm font-semibold text-stone-950">
                Filtros da listagem
              </p>
              <p className="text-sm text-stone-500">
                Busque por código, descrição, status, validade ou tipo de
                desconto.
              </p>
            </div>
          </div>

          <div className="grid gap-3 lg:grid-cols-[1fr_190px_210px_210px_auto]">
            <label className="relative block">
              <Search
                className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400"
                aria-hidden="true"
              />

              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar cupom"
                className="h-12 w-full rounded-full border border-stone-200 bg-[#fbfaf7] pl-11 pr-4 text-sm font-medium text-stone-950 outline-none transition placeholder:text-stone-400 hover:border-stone-300 focus:border-[#d8c28f] focus:bg-white"
              />
            </label>

            <select
              value={activeFilter}
              onChange={(event) =>
                setActiveFilter(event.target.value as ActiveFilter)
              }
              className="h-12 rounded-full border border-stone-200 bg-white px-4 text-sm font-semibold text-stone-950 outline-none transition hover:border-stone-300 focus:border-[#d8c28f]"
            >
              <option value="">Todos</option>
              <option value="true">Ativos</option>
              <option value="false">Inativos</option>
            </select>

            <select
              value={validityFilter}
              onChange={(event) =>
                setValidityFilter(event.target.value as ValidityFilter)
              }
              className="h-12 rounded-full border border-stone-200 bg-white px-4 text-sm font-semibold text-stone-950 outline-none transition hover:border-stone-300 focus:border-[#d8c28f]"
            >
              {validityOptions.map((option) => (
                <option key={option.label} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <select
              value={discountTypeFilter}
              onChange={(event) =>
                setDiscountTypeFilter(event.target.value as "" | DiscountType)
              }
              className="h-12 rounded-full border border-stone-200 bg-white px-4 text-sm font-semibold text-stone-950 outline-none transition hover:border-stone-300 focus:border-[#d8c28f]"
            >
              <option value="">Todos os tipos</option>
              <option value="PERCENTAGE">Percentual</option>
              <option value="FIXED_AMOUNT">Valor fixo</option>
            </select>

            <button
              type="button"
              onClick={clearFilters}
              className="inline-flex h-12 items-center justify-center rounded-full border border-stone-200 bg-white px-5 text-sm font-semibold text-stone-700 transition hover:border-[#d8c28f] hover:bg-[#fbfaf7] hover:text-stone-950"
            >
              Limpar
            </button>
          </div>
        </section>

        <section className="mt-6">
          <div className="mb-4 flex flex-col justify-between gap-3 md:flex-row md:items-end">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#8f6f2e]">
                Cupons cadastrados
              </p>

              <h2 className="mt-2 text-2xl font-semibold tracking-[-0.035em] text-stone-950">
                Lista administrativa
              </h2>
            </div>

            <p className="text-sm text-stone-500">
              {loading
                ? "Carregando cupons..."
                : `${filteredCoupons.length} cupom(ns) nesta visualização`}
            </p>
          </div>

          {loading ? (
            <CouponsSkeleton />
          ) : filteredCoupons.length === 0 ? (
            <EmptyCoupons onCreate={openCreateForm} onClear={clearFilters} />
          ) : (
            <div className="overflow-hidden rounded-[2rem] border border-stone-200 bg-white shadow-[0_20px_54px_rgba(41,37,36,0.05)]">
              <div className="hidden grid-cols-[minmax(260px,1fr)_150px_150px_140px_190px_160px_200px] border-b border-stone-200 bg-[#fbfaf7] px-5 py-4 text-[11px] font-bold uppercase tracking-[0.16em] text-stone-500 xl:grid">
                <span>Cupom</span>
                <span>Desconto</span>
                <span>Pedido mínimo</span>
                <span>Uso</span>
                <span>Validade</span>
                <span>Status</span>
                <span className="text-right">Ações</span>
              </div>

              <div className="divide-y divide-stone-200">
                {filteredCoupons.map((coupon) => (
                  <CouponRow
                    key={coupon.id}
                    coupon={coupon}
                    onEdit={openEditForm}
                    onToggle={() =>
                      setCouponToToggle({
                        coupon,
                        action: coupon.active ? "DEACTIVATE" : "ACTIVATE",
                      })
                    }
                  />
                ))}
              </div>
            </div>
          )}
        </section>

        {formOpen && (
          <div className="fixed inset-0 z-[90] overflow-y-auto bg-[#1f1b16]/35 px-4 py-8 backdrop-blur-sm">
            <div className="mx-auto max-w-6xl overflow-hidden rounded-[2rem] border border-stone-200 bg-white shadow-[0_28px_80px_rgba(46,39,31,0.18)]">
              <div className="flex flex-col justify-between gap-4 border-b border-stone-200 px-6 py-5 md:flex-row md:items-start md:px-8">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#8f6f2e]">
                    {editingCoupon ? "Editar cupom" : "Novo cupom"}
                  </p>

                  <h2 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-stone-950">
                    {editingCoupon ? editingCoupon.code : "Cadastrar cupom"}
                  </h2>

                  <p className="mt-2 max-w-2xl text-sm leading-6 text-stone-500">
                    Configure desconto, validade e limite de uso da campanha.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={closeForm}
                  disabled={saving}
                  className="inline-flex h-11 items-center justify-center rounded-full border border-stone-200 bg-white px-5 text-sm font-semibold text-stone-700 transition hover:border-[#d8c28f] hover:bg-[#fbfaf7] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Fechar
                </button>
              </div>

              <form
                onSubmit={handleSubmit}
                className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_390px]"
              >
                <div className="space-y-7 p-6 md:p-8">
                  <FormSection
                    eyebrow="Identificação"
                    title="Código e descrição"
                    description="O código é o que o cliente digita no carrinho."
                  >
                    <div className="grid gap-4 md:grid-cols-[.7fr_1fr]">
                      <TextField
                        label="Código"
                        value={form.code}
                        onChange={(value) =>
                          updateForm("code", value.toUpperCase())
                        }
                        placeholder="POINT10"
                        required
                      />

                      <TextField
                        label="Descrição"
                        value={form.description}
                        onChange={(value) => updateForm("description", value)}
                        placeholder="Cupom de boas-vindas"
                      />
                    </div>
                  </FormSection>

                  <FormSection
                    eyebrow="Desconto"
                    title="Tipo e valor"
                    description="Escolha entre desconto percentual ou valor fixo."
                  >
                    <div className="grid gap-4 md:grid-cols-3">
                      <label className="block">
                        <span className="text-sm font-semibold text-stone-950">
                          Tipo
                        </span>

                        <select
                          value={form.discountType}
                          onChange={(event) =>
                            updateForm(
                              "discountType",
                              event.target.value as DiscountType
                            )
                          }
                          className="mt-2 h-12 w-full rounded-full border border-stone-200 bg-[#fbfaf7] px-4 text-sm font-semibold text-stone-950 outline-none transition hover:border-stone-300 focus:border-[#d8c28f] focus:bg-white"
                        >
                          <option value="PERCENTAGE">Percentual</option>
                          <option value="FIXED_AMOUNT">Valor fixo</option>
                        </select>
                      </label>

                      <TextField
                        label={
                          form.discountType === "PERCENTAGE"
                            ? "Valor (%)"
                            : "Valor (R$)"
                        }
                        value={form.discountValue}
                        onChange={(value) =>
                          updateForm("discountValue", decimalInput(value))
                        }
                        placeholder={
                          form.discountType === "PERCENTAGE" ? "10" : "25,00"
                        }
                        required
                        inputMode="decimal"
                      />

                      <TextField
                        label="Pedido mínimo"
                        value={form.minimumOrderValue}
                        onChange={(value) =>
                          updateForm("minimumOrderValue", decimalInput(value))
                        }
                        placeholder="100,00"
                        inputMode="decimal"
                      />
                    </div>
                  </FormSection>

                  <FormSection
                    eyebrow="Validade"
                    title="Período e limite"
                    description="Defina quando a campanha começa, termina e quantas vezes pode ser usada."
                  >
                    <div className="grid gap-4 md:grid-cols-3">
                      <DateTimeField
                        label="Início"
                        value={form.startsAt}
                        onChange={(value) => updateForm("startsAt", value)}
                      />

                      <DateTimeField
                        label="Fim"
                        value={form.endsAt}
                        onChange={(value) => updateForm("endsAt", value)}
                      />

                      <TextField
                        label="Limite de uso"
                        value={form.usageLimit}
                        onChange={(value) =>
                          updateForm("usageLimit", onlyInteger(value))
                        }
                        placeholder="100"
                        inputMode="numeric"
                      />
                    </div>

                    <label className="mt-4 flex cursor-pointer items-center justify-between gap-4 rounded-[1.5rem] border border-stone-200 bg-[#fbfaf7] p-4">
                      <span>
                        <span className="block text-sm font-semibold text-stone-950">
                          Cupom ativo
                        </span>
                        <span className="mt-1 block text-sm text-stone-500">
                          Quando inativo, o cupom não pode ser aplicado no
                          carrinho.
                        </span>
                      </span>

                      <input
                        type="checkbox"
                        checked={form.active}
                        onChange={(event) =>
                          updateForm("active", event.target.checked)
                        }
                        className="h-4 w-4 accent-[#8f6f2e]"
                      />
                    </label>
                  </FormSection>
                </div>

                <aside className="border-t border-stone-200 bg-[#f1efea] p-6 lg:border-l lg:border-t-0 md:p-8">
                  <div className="lg:sticky lg:top-8">
                    <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#8f6f2e]">
                      Preview
                    </p>

                    <h3 className="mt-2 text-2xl font-semibold tracking-[-0.035em] text-stone-950">
                      Como a campanha aparece
                    </h3>

                    <CouponPreview form={form} />

                    <button
                      type="submit"
                      disabled={saving}
                      className="mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#8f6f2e] px-5 text-sm font-semibold text-white transition hover:bg-[#76591f] disabled:cursor-not-allowed disabled:bg-stone-300"
                    >
                      {saving && (
                        <Loader2
                          className="h-4 w-4 animate-spin"
                          aria-hidden="true"
                        />
                      )}
                      {saving
                        ? "Salvando"
                        : editingCoupon
                          ? "Salvar alterações"
                          : "Cadastrar cupom"}
                    </button>
                  </div>
                </aside>
              </form>
            </div>
          </div>
        )}

        <ConfirmModal
          open={Boolean(couponToToggle)}
          title={
            couponToToggle?.action === "DEACTIVATE"
              ? "Desativar cupom?"
              : "Reativar cupom?"
          }
          message={
            couponToToggle?.action === "DEACTIVATE"
              ? "O cupom deixará de poder ser aplicado em novos pedidos, mas continuará disponível no histórico administrativo."
              : "O cupom voltará a poder ser aplicado se estiver dentro da validade e do limite de uso."
          }
          confirmLabel={
            couponToToggle?.action === "DEACTIVATE" ? "Desativar" : "Reativar"
          }
          danger={couponToToggle?.action === "DEACTIVATE"}
          loading={saving}
          onClose={() => {
            if (!saving) setCouponToToggle(null);
          }}
          onConfirm={handleToggleCoupon}
        />
      </div>
    </main>
  );
}

function CouponRow({
  coupon,
  onEdit,
  onToggle,
}: {
  coupon: CouponResponse;
  onEdit: (coupon: CouponResponse) => void;
  onToggle: () => void;
}) {
  const status = getCouponStatus(coupon);

  return (
    <article className="grid gap-0 p-4 transition hover:bg-[#fbfaf7] xl:grid-cols-[minmax(260px,1fr)_150px_150px_140px_190px_160px_200px] xl:items-center xl:px-5">
      <AdminCell label="Cupom">
        <div className="min-w-0">
          <p className="line-clamp-1 text-lg font-semibold tracking-[-0.025em] text-stone-950">
            {coupon.code}
          </p>

          <p className="mt-1 line-clamp-2 text-sm leading-5 text-stone-500">
            {coupon.description || "Sem descrição administrativa."}
          </p>
        </div>
      </AdminCell>

      <AdminCell label="Desconto">
        <div>
          <p className="whitespace-nowrap text-base font-semibold text-stone-950">
            {formatDiscountValue(coupon.discountType, coupon.discountValue)}
          </p>
          <p className="mt-1 text-xs text-stone-500">
            {DISCOUNT_TYPE_LABELS[coupon.discountType]}
          </p>
        </div>
      </AdminCell>

      <AdminCell label="Pedido mínimo">
        <span className="whitespace-nowrap text-sm font-semibold text-stone-950">
          {formatCurrency(coupon.minimumOrderValue)}
        </span>
      </AdminCell>

      <AdminCell label="Uso">
        <span className="whitespace-nowrap text-sm font-semibold text-stone-950">
          {coupon.usedCount}
          {coupon.usageLimit ? ` / ${coupon.usageLimit}` : " / sem limite"}
        </span>
      </AdminCell>

      <AdminCell label="Validade">
        <span className="text-sm leading-5 text-stone-600">
          {formatCouponPeriod(coupon)}
        </span>
      </AdminCell>

      <AdminCell label="Status">
        <span
          className={`inline-flex whitespace-nowrap rounded-full px-3 py-1 text-xs font-bold ${status.className}`}
        >
          {status.label}
        </span>
      </AdminCell>

      <div className="mt-5 flex flex-wrap gap-2 xl:mt-0 xl:flex-nowrap xl:justify-end">
        <button
          type="button"
          onClick={() => onEdit(coupon)}
          className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-full border border-stone-200 bg-white px-4 text-sm font-semibold text-stone-950 transition hover:border-[#d8c28f] hover:bg-[#fbfaf7] xl:flex-none"
        >
          <Edit3 className="h-4 w-4" aria-hidden="true" />
          Editar
        </button>

        <button
          type="button"
          onClick={onToggle}
          className={`inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-full px-4 text-sm font-semibold transition xl:flex-none ${
            coupon.active
              ? "border border-[var(--pc-danger)]/25 bg-white text-[var(--pc-danger)] hover:bg-[var(--pc-danger-soft)]"
              : "bg-[var(--pc-green)] text-white hover:bg-[var(--pc-green-hover)]"
          }`}
        >
          {coupon.active ? (
            <PowerOff className="h-4 w-4" aria-hidden="true" />
          ) : (
            <Power className="h-4 w-4" aria-hidden="true" />
          )}
          {coupon.active ? "Desativar" : "Ativar"}
        </button>
      </div>
    </article>
  );
}

function CouponPreview({ form }: { form: CouponFormState }) {
  const discountNumber = parseDecimal(form.discountValue || "0");
  const minOrder = parseDecimal(form.minimumOrderValue || "0");

  return (
    <div className="mt-6 overflow-hidden rounded-[1.75rem] border border-stone-200 bg-white">
      <div className="bg-[#fbfaf7] p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#8f6f2e]">
              Cupom
            </p>

            <h4 className="mt-2 text-3xl font-semibold tracking-[-0.045em] text-stone-950">
              {form.code || "POINT10"}
            </h4>
          </div>

          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#f4ead0] text-[#8f6f2e]">
            <Gift className="h-5 w-5" aria-hidden="true" />
          </div>
        </div>

        <p className="mt-4 text-sm leading-6 text-stone-500">
          {form.description || "Descrição administrativa da campanha."}
        </p>
      </div>

      <div className="p-5">
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-stone-500">
          Desconto
        </p>

        <p className="mt-2 text-2xl font-semibold tracking-[-0.035em] text-stone-950">
          {formatDiscountValue(form.discountType, discountNumber)}
        </p>

        <div className="mt-5 space-y-3 text-sm">
          <SummaryRow
            label="Pedido mínimo"
            value={minOrder > 0 ? formatCurrency(minOrder) : "Sem mínimo"}
          />
          <SummaryRow
            label="Tipo"
            value={DISCOUNT_TYPE_LABELS[form.discountType]}
          />
          <SummaryRow
            label="Limite"
            value={form.usageLimit || "Sem limite"}
          />
          <SummaryRow
            label="Status"
            value={form.active ? "Ativo" : "Inativo"}
          />
        </div>
      </div>
    </div>
  );
}

function UrgentCouponItem({ coupon }: { coupon: CouponResponse }) {
  const exhausted = isCouponExhausted(coupon);

  return (
    <div className="rounded-[1.5rem] border border-stone-200 bg-white p-4">
      <div className="flex gap-3">
        <div
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
            exhausted
              ? "bg-[#f4ead0] text-[#8f6f2e]"
              : "bg-[var(--pc-danger-soft)] text-[var(--pc-danger)]"
          }`}
        >
          {exhausted ? (
            <WalletCards className="h-4 w-4" aria-hidden="true" />
          ) : (
            <XCircle className="h-4 w-4" aria-hidden="true" />
          )}
        </div>

        <div className="min-w-0">
          <p className="line-clamp-1 text-sm font-semibold text-stone-950">
            {coupon.code}
          </p>

          <p className="mt-1 text-xs leading-5 text-stone-500">
            {exhausted
              ? "Limite de uso atingido."
              : "Cupom fora do período de validade."}
          </p>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  tone = "neutral",
}: {
  label: string;
  value: number;
  icon: LucideIcon;
  tone?: "neutral" | "premium" | "danger";
}) {
  const toneClass = {
    neutral: "text-stone-500 bg-[#fbfaf7]",
    premium: "text-[#8f6f2e] bg-[#f4ead0]",
    danger: "text-[var(--pc-danger)] bg-[var(--pc-danger-soft)]",
  }[tone];

  return (
    <div className="rounded-[1.5rem] border border-stone-200 bg-[#fbfaf7] p-4">
      <div className="flex items-center justify-between gap-4">
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-stone-500">
          {label}
        </p>

        <span
          className={`flex h-8 w-8 items-center justify-center rounded-full ${toneClass}`}
        >
          <Icon className="h-4 w-4" aria-hidden="true" />
        </span>
      </div>

      <p className="mt-4 text-3xl font-semibold tracking-[-0.04em] text-stone-950">
        {value}
      </p>
    </div>
  );
}

function FormSection({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-[1.75rem] border border-stone-200 bg-white p-5">
      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#8f6f2e]">
        {eyebrow}
      </p>

      <h3 className="mt-2 text-xl font-semibold tracking-[-0.03em] text-stone-950">
        {title}
      </h3>

      <p className="mt-2 text-sm leading-6 text-stone-500">{description}</p>

      <div className="mt-5">{children}</div>
    </section>
  );
}

function TextField({
  label,
  value,
  onChange,
  placeholder,
  required = false,
  inputMode,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  inputMode?: InputHTMLAttributes<HTMLInputElement>["inputMode"];
}) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-stone-950">{label}</span>

      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required={required}
        inputMode={inputMode}
        placeholder={placeholder}
        className="mt-2 h-12 w-full rounded-full border border-stone-200 bg-[#fbfaf7] px-4 text-sm font-medium text-stone-950 outline-none transition placeholder:text-stone-400 hover:border-stone-300 focus:border-[#d8c28f] focus:bg-white"
      />
    </label>
  );
}

function DateTimeField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-stone-950">{label}</span>

      <input
        type="datetime-local"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 h-12 w-full rounded-full border border-stone-200 bg-[#fbfaf7] px-4 text-sm font-medium text-stone-950 outline-none transition hover:border-stone-300 focus:border-[#d8c28f] focus:bg-white"
      />
    </label>
  );
}

function AdminCell({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="mt-4 first:mt-0 xl:mt-0">
      <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.14em] text-stone-500 xl:hidden">
        {label}
      </p>
      {children}
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-stone-200 pb-3 last:border-b-0 last:pb-0">
      <span className="text-stone-500">{label}</span>
      <span className="max-w-[180px] text-right font-semibold text-stone-950">
        {value}
      </span>
    </div>
  );
}

function EmptyCoupons({
  onCreate,
  onClear,
}: {
  onCreate: () => void;
  onClear: () => void;
}) {
  return (
    <section className="rounded-[2rem] border border-stone-200 bg-white p-10 text-center shadow-sm">
      <TicketPercent
        className="mx-auto h-10 w-10 text-stone-400"
        aria-hidden="true"
      />

      <h2 className="mt-5 text-2xl font-semibold tracking-[-0.035em] text-stone-950">
        Nenhum cupom encontrado
      </h2>

      <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-stone-500">
        Ajuste os filtros ou crie um novo cupom para campanhas promocionais.
      </p>

      <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
        <button
          type="button"
          onClick={onClear}
          className="inline-flex h-11 items-center justify-center rounded-full border border-stone-200 bg-white px-5 text-sm font-semibold text-stone-950 transition hover:border-[#d8c28f] hover:bg-[#fbfaf7]"
        >
          Limpar filtros
        </button>

        <button
          type="button"
          onClick={onCreate}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[#8f6f2e] px-5 text-sm font-semibold text-white transition hover:bg-[#76591f]"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Novo cupom
        </button>
      </div>
    </section>
  );
}

function CouponsSkeleton() {
  return (
    <div className="overflow-hidden rounded-[2rem] border border-stone-200 bg-white">
      {Array.from({ length: 6 }).map((_, index) => (
        <div
          key={index}
          className="grid gap-4 border-b border-stone-200 p-4 last:border-b-0 xl:grid-cols-[minmax(260px,1fr)_150px_150px_140px_190px_160px_200px]"
        >
          {Array.from({ length: 7 }).map((__, childIndex) => (
            <div
              key={childIndex}
              className="h-6 animate-pulse rounded bg-stone-200"
            />
          ))}
        </div>
      ))}
    </div>
  );
}

function getCouponStatus(coupon: CouponResponse) {
  if (!coupon.active) {
    return {
      label: "Inativo",
      className: "bg-stone-100 text-stone-500",
    };
  }

  if (isCouponExhausted(coupon)) {
    return {
      label: "Limite atingido",
      className: "bg-[#f4ead0] text-[#8f6f2e]",
    };
  }

  if (isCouponScheduled(coupon)) {
    return {
      label: "Agendado",
      className: "bg-stone-100 text-stone-600",
    };
  }

  if (isCouponExpired(coupon)) {
    return {
      label: "Expirado",
      className: "bg-[var(--pc-danger-soft)] text-[var(--pc-danger)]",
    };
  }

  if (coupon.currentlyValid) {
    return {
      label: "Válido agora",
      className: "bg-[var(--pc-green-soft)] text-[var(--pc-green)]",
    };
  }

  return {
    label: "Indisponível",
    className: "bg-stone-100 text-stone-600",
  };
}

function isCouponValidNow(coupon: CouponResponse) {
  return coupon.active && coupon.currentlyValid && !isCouponExhausted(coupon);
}

function isCouponScheduled(coupon: CouponResponse) {
  if (!coupon.startsAt) return false;

  return coupon.active && new Date(coupon.startsAt).getTime() > Date.now();
}

function isCouponExpired(coupon: CouponResponse) {
  if (!coupon.endsAt) return false;

  return new Date(coupon.endsAt).getTime() < Date.now();
}

function isCouponExhausted(coupon: CouponResponse) {
  return (
    coupon.usageLimit !== null &&
    coupon.usedCount >= coupon.usageLimit
  );
}

function formatDiscountValue(type: DiscountType, value: number) {
  const safeValue = Number.isFinite(Number(value)) ? Number(value) : 0;

  if (type === "PERCENTAGE") {
    return `${safeValue.toLocaleString("pt-BR", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    })}%`;
  }

  return formatCurrency(safeValue);
}

function formatCouponPeriod(coupon: CouponResponse) {
  if (coupon.startsAt && coupon.endsAt) {
    return `${formatDateTime(coupon.startsAt)} até ${formatDateTime(
      coupon.endsAt
    )}`;
  }

  if (coupon.startsAt) {
    return `A partir de ${formatDateTime(coupon.startsAt)}`;
  }

  if (coupon.endsAt) {
    return `Até ${formatDateTime(coupon.endsAt)}`;
  }

  return "Sem validade definida";
}

function toDateTimeInputValue(value: string | null) {
  if (!value) return "";

  return value.slice(0, 16);
}

function parseDecimal(value: string) {
  const normalized = value.replace(/\./g, "").replace(",", ".");
  return Number(normalized);
}

function decimalInput(value: string) {
  return value.replace(/[^\d,.]/g, "");
}

function onlyInteger(value: string) {
  return value.replace(/\D/g, "");
}