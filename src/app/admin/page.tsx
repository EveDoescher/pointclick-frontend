"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BadgePercent,
  Boxes,
  CheckCircle2,
  Clock,
  CreditCard,
  Package,
  PackageSearch,
  RefreshCw,
  Send,
  ShoppingBag,
  TicketPercent,
  Truck,
  UserRound,
  Users,
  WalletCards,
  type LucideIcon,
} from "lucide-react";
import { AdminRoute } from "@/components/auth/AdminRoute";
import type { AdminDashboardResponse } from "@/types/admin";
import type { CouponResponse } from "@/types/coupon";
import { adminService } from "@/services/adminService";
import { couponService } from "@/services/couponService";
import { useFeedbackModal } from "@/contexts/FeedbackModalContext";
import { formatCurrency } from "@/utils/formatters";

type Shortcut = {
  href: string;
  icon: LucideIcon;
  title: string;
  description: string;
  meta: string;
};

export default function AdminPage() {
  return (
    <AdminRoute>
      <AdminDashboardContent />
    </AdminRoute>
  );
}

function AdminDashboardContent() {
  const { showError } = useFeedbackModal();

  const [dashboard, setDashboard] = useState<AdminDashboardResponse | null>(
    null
  );
  const [coupons, setCoupons] = useState<CouponResponse[]>([]);
  const [loading, setLoading] = useState(true);

  const operationalOrders = useMemo(() => {
    if (!dashboard) return 0;

    return (
      dashboard.closedOrders +
      dashboard.paidOrders +
      dashboard.shippedOrders +
      dashboard.deliveredOrders
    );
  }, [dashboard]);

  const criticalProducts = useMemo(() => {
    if (!dashboard) return 0;

    return dashboard.lowStockProducts + dashboard.outOfStockProducts;
  }, [dashboard]);

  const totalProducts = useMemo(() => {
    if (!dashboard) return 0;

    return dashboard.activeProducts + dashboard.inactiveProducts;
  }, [dashboard]);

  const totalUsers = useMemo(() => {
    if (!dashboard) return 0;

    return dashboard.activeUsers + dashboard.inactiveUsers;
  }, [dashboard]);

  const couponStats = useMemo(() => {
    const total = coupons.length;
    const active = coupons.filter((coupon) => coupon.active).length;
    const validNow = coupons.filter(isCouponValidNow).length;
    const exhausted = coupons.filter(isCouponExhausted).length;
    const expired = coupons.filter(isCouponExpired).length;
    const totalUses = coupons.reduce(
      (sum, coupon) => sum + coupon.usedCount,
      0
    );

    return {
      total,
      active,
      validNow,
      exhausted,
      expired,
      totalUses,
      unavailable: expired + exhausted,
    };
  }, [coupons]);

  const orderFlow = useMemo(() => {
    if (!dashboard) return [];

    return [
      {
        label: "Aguardando pagamento",
        value: dashboard.closedOrders,
        description: "Pedidos fechados sem pagamento",
      },
      {
        label: "Aguardando envio",
        value: dashboard.paidOrders,
        description: "Pedidos pagos para preparar",
      },
      {
        label: "A caminho",
        value: dashboard.shippedOrders,
        description: "Pedidos enviados",
      },
      {
        label: "Aguardando cliente",
        value: dashboard.deliveredOrders,
        description: "Entregues sem confirmação",
      },
      {
        label: "Finalizados",
        value: dashboard.finishedOrders,
        description: "Compras concluídas",
      },
    ];
  }, [dashboard]);

  const stockHealth = useMemo(() => {
    if (!dashboard) return [];

    return [
      {
        label: "Ativos",
        value: dashboard.activeProducts,
        tone: "success" as const,
      },
      {
        label: "Baixo estoque",
        value: dashboard.lowStockProducts,
        tone: "warning" as const,
      },
      {
        label: "Sem estoque",
        value: dashboard.outOfStockProducts,
        tone: "danger" as const,
      },
      {
        label: "Inativos",
        value: dashboard.inactiveProducts,
        tone: "neutral" as const,
      },
    ];
  }, [dashboard]);

  const shortcuts = useMemo<Shortcut[]>(() => {
    return [
      {
        href: "/admin/produtos",
        icon: ShoppingBag,
        title: "Produtos",
        description: "Gerenciar vitrine, estoque, preços e disponibilidade.",
        meta: dashboard
          ? `${criticalProducts} item(ns) pedem atenção`
          : "Estoque e catálogo",
      },
      {
        href: "/admin/pedidos",
        icon: Package,
        title: "Pedidos",
        description: "Acompanhar pagamento, envio, entrega e histórico.",
        meta: dashboard
          ? `${operationalOrders} pedido(s) em fluxo`
          : "Operação de pedidos",
      },
      {
        href: "/admin/usuarios",
        icon: Users,
        title: "Usuários",
        description: "Consultar clientes, admins, contas e dados de checkout.",
        meta: dashboard ? `${totalUsers} conta(s)` : "Clientes e acesso",
      },
      {
        href: "/admin/cupons",
        icon: TicketPercent,
        title: "Cupons",
        description: "Criar campanhas, validade, limites e descontos.",
        meta: `${couponStats.validNow} cupom(ns) válidos agora`,
      },
    ];
  }, [dashboard, criticalProducts, operationalOrders, totalUsers, couponStats.validNow]);

  async function loadDashboard() {
    setLoading(true);

    try {
      const [dashboardResponse, couponsResponse] = await Promise.all([
        adminService.getDashboard(),
        couponService.findAll(null).catch(() => []),
      ]);

      setDashboard(dashboardResponse);
      setCoupons(couponsResponse);
    } catch (error) {
      showError(error, "Erro ao carregar dashboard");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  return (
    <main className="min-h-screen bg-[#f8f7f3] px-4 py-8 lg:px-8 lg:py-10">
      <div className="mx-auto max-w-7xl">
        <section className="overflow-hidden rounded-[2rem] border border-stone-200 bg-white shadow-[0_20px_54px_rgba(41,37,36,0.06)]">
          <div className="grid gap-0 xl:grid-cols-[1fr_390px]">
            <div className="p-6 md:p-8">
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#8f6f2e]">
                Admin • PointClick
              </p>

              <div className="mt-4 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
                <div>
                  <h1 className="max-w-3xl text-4xl font-semibold leading-[1.02] tracking-[-0.05em] text-stone-950 md:text-5xl">
                    Painel administrativo
                  </h1>

                  <p className="mt-4 max-w-2xl text-base leading-7 text-stone-600">
                    Visão geral da operação: receita, pedidos em andamento,
                    estoque, clientes e campanhas promocionais.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={loadDashboard}
                  disabled={loading}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-stone-200 bg-white px-5 text-sm font-semibold text-stone-950 transition hover:border-[#d8c28f] hover:bg-[#fbfaf7] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <RefreshCw
                    className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
                    aria-hidden="true"
                  />
                  Atualizar
                </button>
              </div>

              {loading ? (
                <HeroSkeleton />
              ) : !dashboard ? (
                <div className="mt-8 rounded-[1.75rem] border border-stone-200 bg-[#fbfaf7] p-6">
                  <p className="text-sm font-semibold text-stone-950">
                    Não foi possível carregar o dashboard.
                  </p>
                  <p className="mt-2 text-sm leading-6 text-stone-500">
                    Verifique se o backend está rodando e tente atualizar.
                  </p>
                </div>
              ) : (
                <div className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  <MetricCard
                    label="Receita"
                    value={formatCurrency(dashboard.totalRevenue)}
                    description="Pedidos pagos ou concluídos"
                    icon={WalletCards}
                    tone="premium"
                  />

                  <MetricCard
                    label="Pedidos"
                    value={dashboard.totalOrders}
                    description={`${operationalOrders} em fluxo operacional`}
                    icon={Package}
                  />

                  <MetricCard
                    label="Estoque"
                    value={criticalProducts}
                    description="Itens com baixo estoque ou zerados"
                    icon={PackageSearch}
                    tone={criticalProducts > 0 ? "warning" : "neutral"}
                  />

                  <MetricCard
                    label="Cupons"
                    value={couponStats.validNow}
                    description={`${couponStats.totalUses} uso(s) registrados`}
                    icon={BadgePercent}
                  />
                </div>
              )}
            </div>

            <aside className="border-t border-stone-200 bg-[#fbfaf7] p-6 xl:border-l xl:border-t-0 md:p-8">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#8f6f2e]">
                Operação
              </p>

              <h2 className="mt-3 text-2xl font-semibold tracking-[-0.035em] text-stone-950">
                Pontos de atenção
              </h2>

              <p className="mt-3 text-sm leading-6 text-stone-600">
                Indicadores que ajudam a decidir onde agir primeiro.
              </p>

              {loading || !dashboard ? (
                <div className="mt-6 space-y-3">
                  {Array.from({ length: 4 }).map((_, index) => (
                    <div
                      key={index}
                      className="h-16 animate-pulse rounded-[1.25rem] bg-stone-200"
                    />
                  ))}
                </div>
              ) : (
                <div className="mt-6 space-y-3">
                  <AttentionRow
                    icon={CreditCard}
                    label="Aguardando pagamento"
                    value={dashboard.closedOrders}
                    href="/admin/pedidos"
                  />
                  <AttentionRow
                    icon={Send}
                    label="Pagos aguardando envio"
                    value={dashboard.paidOrders}
                    href="/admin/pedidos"
                    highlight={dashboard.paidOrders > 0}
                  />
                  <AttentionRow
                    icon={Truck}
                    label="Aguardando confirmação"
                    value={dashboard.deliveredOrders}
                    href="/admin/pedidos"
                  />
                  <AttentionRow
                    icon={PackageSearch}
                    label="Estoque crítico"
                    value={criticalProducts}
                    href="/admin/produtos"
                    highlight={criticalProducts > 0}
                  />
                </div>
              )}
            </aside>
          </div>
        </section>

        <section className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {shortcuts.map((shortcut) => (
            <AdminShortcut key={shortcut.href} shortcut={shortcut} />
          ))}
        </section>

        {loading ? (
          <DashboardSkeleton />
        ) : dashboard ? (
          <>
            <section className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(360px,.9fr)]">
              <OrderFlowPanel orderFlow={orderFlow} />

              <StockHealthPanel
                stockHealth={stockHealth}
                totalProducts={totalProducts}
              />
            </section>

            <section className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,.95fr)_minmax(0,1.05fr)]">
              <CouponPanel couponStats={couponStats} />

              <CustomerPanel dashboard={dashboard} totalUsers={totalUsers} />
            </section>

            <section className="mt-6 overflow-hidden rounded-[2rem] border border-stone-200 bg-white shadow-[0_20px_54px_rgba(41,37,36,0.04)]">
              <div className="grid gap-0 lg:grid-cols-[1fr_1fr_1fr]">
                <SummaryLink
                  href="/admin/pedidos"
                  eyebrow="Pedidos"
                  title="Fluxo operacional"
                  description="Acompanhe pagamentos, envio e entrega."
                  icon={Package}
                />
                <SummaryLink
                  href="/admin/produtos"
                  eyebrow="Catálogo"
                  title="Saúde da vitrine"
                  description="Revise disponibilidade e estoque."
                  icon={Boxes}
                />
                <SummaryLink
                  href="/admin/cupons"
                  eyebrow="Campanhas"
                  title="Cupons e descontos"
                  description="Gerencie campanhas ativas e expiradas."
                  icon={TicketPercent}
                />
              </div>
            </section>
          </>
        ) : null}
      </div>
    </main>
  );
}

function MetricCard({
  label,
  value,
  description,
  icon: Icon,
  tone = "neutral",
}: {
  label: string;
  value: string | number;
  description: string;
  icon: LucideIcon;
  tone?: "neutral" | "premium" | "warning";
}) {
  const toneClass = {
    neutral: "bg-white text-stone-500 ring-stone-200",
    premium: "bg-[#f4ead0] text-[#8f6f2e] ring-[#ead8ad]",
    warning: "bg-[#f4ead0] text-[#8f6f2e] ring-[#ead8ad]",
  }[tone];

  return (
    <div className="rounded-[1.5rem] border border-stone-200 bg-[#fbfaf7] p-4">
      <div className="flex items-start justify-between gap-4">
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-stone-500">
          {label}
        </p>

        <span
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ring-1 ${toneClass}`}
        >
          <Icon className="h-4 w-4" aria-hidden="true" />
        </span>
      </div>

      <p className="mt-4 whitespace-nowrap text-2xl font-semibold tracking-[-0.04em] text-stone-950">
        {value}
      </p>

      <p className="mt-2 text-sm leading-5 text-stone-500">{description}</p>
    </div>
  );
}

function AttentionRow({
  icon: Icon,
  label,
  value,
  href,
  highlight = false,
}: {
  icon: LucideIcon;
  label: string;
  value: number;
  href: string;
  highlight?: boolean;
}) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between gap-4 rounded-[1.25rem] border border-stone-200 bg-white px-4 py-3 transition hover:border-[#d8c28f] hover:bg-[#fffefa]"
    >
      <span className="flex min-w-0 items-center gap-3">
        <span
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
            highlight
              ? "bg-[#f4ead0] text-[#8f6f2e]"
              : "bg-[#fbfaf7] text-stone-500"
          }`}
        >
          <Icon className="h-4 w-4" aria-hidden="true" />
        </span>

        <span className="line-clamp-1 text-sm font-semibold text-stone-700">
          {label}
        </span>
      </span>

      <span
        className={`shrink-0 text-base font-semibold ${
          highlight ? "text-[#8f6f2e]" : "text-stone-950"
        }`}
      >
        {value}
      </span>
    </Link>
  );
}

function AdminShortcut({ shortcut }: { shortcut: Shortcut }) {
  const Icon = shortcut.icon;

  return (
    <Link
      href={shortcut.href}
      className="group overflow-hidden rounded-[2rem] border border-stone-200 bg-white shadow-[0_18px_48px_rgba(41,37,36,0.045)] transition hover:-translate-y-0.5 hover:border-[#d8c28f] hover:shadow-[0_24px_64px_rgba(41,37,36,0.09)]"
    >
      <div className="border-b border-stone-200 bg-[#fbfaf7] p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-[#8f6f2e] ring-1 ring-stone-200">
            <Icon className="h-5 w-5" aria-hidden="true" />
          </div>

          <ArrowRight
            className="h-4 w-4 text-stone-400 transition group-hover:translate-x-1 group-hover:text-[#8f6f2e]"
            aria-hidden="true"
          />
        </div>

        <h3 className="mt-5 text-xl font-semibold tracking-[-0.03em] text-stone-950">
          {shortcut.title}
        </h3>

        <p className="mt-2 text-sm leading-6 text-stone-500">
          {shortcut.description}
        </p>
      </div>

      <div className="px-5 py-4">
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-stone-500">
          {shortcut.meta}
        </p>
      </div>
    </Link>
  );
}

function OrderFlowPanel({
  orderFlow,
}: {
  orderFlow: {
    label: string;
    value: number;
    description: string;
  }[];
}) {
  const maxValue = Math.max(...orderFlow.map((item) => item.value), 1);

  return (
    <section className="rounded-[2rem] border border-stone-200 bg-white p-6 shadow-[0_20px_54px_rgba(41,37,36,0.04)] md:p-7">
      <SectionHeader
        eyebrow="Pedidos"
        title="Fila operacional"
        description="Pedidos em cada etapa do fluxo de compra."
        actionHref="/admin/pedidos"
        actionLabel="Ver pedidos"
      />

      <div className="mt-7 space-y-5">
        {orderFlow.map((item) => (
          <BarRow
            key={item.label}
            label={item.label}
            value={item.value}
            description={item.description}
            percentage={getPercentage(item.value, maxValue)}
          />
        ))}
      </div>
    </section>
  );
}

function StockHealthPanel({
  stockHealth,
  totalProducts,
}: {
  stockHealth: {
    label: string;
    value: number;
    tone: "success" | "warning" | "danger" | "neutral";
  }[];
  totalProducts: number;
}) {
  return (
    <section className="rounded-[2rem] border border-stone-200 bg-white p-6 shadow-[0_20px_54px_rgba(41,37,36,0.04)] md:p-7">
      <SectionHeader
        eyebrow="Catálogo"
        title="Saúde do estoque"
        description="Distribuição dos produtos por disponibilidade."
        actionHref="/admin/produtos"
        actionLabel="Ver produtos"
      />

      <div className="mt-7 space-y-4">
        {stockHealth.map((item) => (
          <StockRow
            key={item.label}
            label={item.label}
            value={item.value}
            percentage={getPercentage(item.value, Math.max(totalProducts, 1))}
            tone={item.tone}
          />
        ))}
      </div>

      <div className="mt-6 rounded-[1.5rem] border border-stone-200 bg-[#fbfaf7] p-5">
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-stone-500">
          Total no catálogo
        </p>

        <p className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-stone-950">
          {totalProducts}
        </p>
      </div>
    </section>
  );
}

function CouponPanel({
  couponStats,
}: {
  couponStats: {
    total: number;
    active: number;
    validNow: number;
    exhausted: number;
    expired: number;
    totalUses: number;
    unavailable: number;
  };
}) {
  return (
    <section className="rounded-[2rem] border border-stone-200 bg-white p-6 shadow-[0_20px_54px_rgba(41,37,36,0.04)] md:p-7">
      <SectionHeader
        eyebrow="Campanhas"
        title="Cupons de desconto"
        description="Controle rápido de campanhas promocionais."
        actionHref="/admin/cupons"
        actionLabel="Gerenciar cupons"
      />

      <div className="mt-7 grid gap-3 sm:grid-cols-2">
        <SmallMetric
          label="Válidos agora"
          value={couponStats.validNow}
          icon={BadgePercent}
          tone="premium"
        />
        <SmallMetric
          label="Ativos"
          value={couponStats.active}
          icon={CheckCircle2}
        />
        <SmallMetric
          label="Usos registrados"
          value={couponStats.totalUses}
          icon={CreditCard}
        />
        <SmallMetric
          label="Indisponíveis"
          value={couponStats.unavailable}
          icon={Clock}
          tone={couponStats.unavailable > 0 ? "warning" : "neutral"}
        />
      </div>
    </section>
  );
}

function CustomerPanel({
  dashboard,
  totalUsers,
}: {
  dashboard: AdminDashboardResponse;
  totalUsers: number;
}) {
  const customerPercentage = getPercentage(
    dashboard.customerUsers,
    Math.max(totalUsers, 1)
  );
  const adminPercentage = getPercentage(dashboard.adminUsers, Math.max(totalUsers, 1));
  const activePercentage = getPercentage(
    dashboard.activeUsers,
    Math.max(totalUsers, 1)
  );

  return (
    <section className="rounded-[2rem] border border-stone-200 bg-white p-6 shadow-[0_20px_54px_rgba(41,37,36,0.04)] md:p-7">
      <SectionHeader
        eyebrow="Clientes"
        title="Base de usuários"
        description="Distribuição de contas ativas, clientes e administradores."
        actionHref="/admin/usuarios"
        actionLabel="Ver usuários"
      />

      <div className="mt-7 space-y-4">
        <StockRow
          label="Contas ativas"
          value={dashboard.activeUsers}
          percentage={activePercentage}
          tone="success"
        />
        <StockRow
          label="Clientes"
          value={dashboard.customerUsers}
          percentage={customerPercentage}
          tone="neutral"
        />
        <StockRow
          label="Administradores"
          value={dashboard.adminUsers}
          percentage={adminPercentage}
          tone="warning"
        />
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <SmallMetric
          label="Total de contas"
          value={totalUsers}
          icon={Users}
        />
        <SmallMetric
          label="Inativas"
          value={dashboard.inactiveUsers}
          icon={UserRound}
          tone={dashboard.inactiveUsers > 0 ? "warning" : "neutral"}
        />
      </div>
    </section>
  );
}

function SectionHeader({
  eyebrow,
  title,
  description,
  actionHref,
  actionLabel,
}: {
  eyebrow: string;
  title: string;
  description: string;
  actionHref?: string;
  actionLabel?: string;
}) {
  return (
    <div className="flex flex-col justify-between gap-4 border-b border-stone-200 pb-5 md:flex-row md:items-end">
      <div>
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#8f6f2e]">
          {eyebrow}
        </p>

        <h2 className="mt-2 text-2xl font-semibold tracking-[-0.035em] text-stone-950">
          {title}
        </h2>

        <p className="mt-2 text-sm leading-6 text-stone-500">{description}</p>
      </div>

      {actionHref && actionLabel && (
        <Link
          href={actionHref}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-full border border-stone-200 bg-white px-4 text-sm font-semibold text-stone-950 transition hover:border-[#d8c28f] hover:bg-[#fbfaf7]"
        >
          {actionLabel}
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      )}
    </div>
  );
}

function BarRow({
  label,
  value,
  description,
  percentage,
}: {
  label: string;
  value: number;
  description: string;
  percentage: number;
}) {
  return (
    <div>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-stone-950">{label}</p>
          <p className="mt-1 text-xs leading-5 text-stone-500">{description}</p>
        </div>

        <span className="whitespace-nowrap text-sm font-semibold text-stone-950">
          {value}
        </span>
      </div>

      <div className="mt-3 h-2 overflow-hidden rounded-full bg-stone-100">
        <div
          className="h-full rounded-full bg-[#8f6f2e]"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

function StockRow({
  label,
  value,
  percentage,
  tone,
}: {
  label: string;
  value: number;
  percentage: number;
  tone: "success" | "warning" | "danger" | "neutral";
}) {
  const barClass = {
    success: "bg-[var(--pc-green)]",
    warning: "bg-[#8f6f2e]",
    danger: "bg-[var(--pc-danger)]",
    neutral: "bg-stone-500",
  }[tone];

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm font-semibold text-stone-700">{label}</p>
        <p className="whitespace-nowrap text-sm font-semibold text-stone-950">
          {value}
        </p>
      </div>

      <div className="mt-2 h-2 overflow-hidden rounded-full bg-stone-100">
        <div
          className={`h-full rounded-full ${barClass}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

function SmallMetric({
  label,
  value,
  icon: Icon,
  tone = "neutral",
}: {
  label: string;
  value: number;
  icon: LucideIcon;
  tone?: "neutral" | "premium" | "warning";
}) {
  const toneClass = {
    neutral: "bg-[#fbfaf7] text-stone-500",
    premium: "bg-[#f4ead0] text-[#8f6f2e]",
    warning: "bg-[#f4ead0] text-[#8f6f2e]",
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

      <p className="mt-4 text-2xl font-semibold tracking-[-0.04em] text-stone-950">
        {value}
      </p>
    </div>
  );
}

function SummaryLink({
  href,
  eyebrow,
  title,
  description,
  icon: Icon,
}: {
  href: string;
  eyebrow: string;
  title: string;
  description: string;
  icon: LucideIcon;
}) {
  return (
    <Link
      href={href}
      className="group border-b border-stone-200 p-6 transition hover:bg-[#fbfaf7] last:border-b-0 lg:border-b-0 lg:border-r lg:last:border-r-0 md:p-7"
    >
      <div className="flex items-start justify-between gap-4">
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#f4ead0] text-[#8f6f2e]">
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>

        <ArrowRight
          className="h-4 w-4 text-stone-400 transition group-hover:translate-x-1 group-hover:text-[#8f6f2e]"
          aria-hidden="true"
        />
      </div>

      <p className="mt-5 text-[11px] font-bold uppercase tracking-[0.16em] text-[#8f6f2e]">
        {eyebrow}
      </p>

      <h3 className="mt-2 text-xl font-semibold tracking-[-0.03em] text-stone-950">
        {title}
      </h3>

      <p className="mt-2 text-sm leading-6 text-stone-500">{description}</p>
    </Link>
  );
}

function HeroSkeleton() {
  return (
    <div className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <div
          key={index}
          className="h-36 animate-pulse rounded-[1.5rem] bg-stone-200"
        />
      ))}
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="mt-6 grid gap-6 xl:grid-cols-2">
      {Array.from({ length: 4 }).map((_, index) => (
        <div
          key={index}
          className="h-80 animate-pulse rounded-[2rem] bg-stone-200"
        />
      ))}
    </div>
  );
}

function getPercentage(value: number, total: number) {
  if (!total || total <= 0) return 0;

  return Math.min(Math.max((value / total) * 100, 0), 100);
}

function isCouponValidNow(coupon: CouponResponse) {
  return coupon.active && coupon.currentlyValid && !isCouponExhausted(coupon);
}

function isCouponExpired(coupon: CouponResponse) {
  if (!coupon.endsAt) return false;

  return new Date(coupon.endsAt).getTime() < Date.now();
}

function isCouponExhausted(coupon: CouponResponse) {
  return coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit;
}