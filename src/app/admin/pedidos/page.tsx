"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Ban,
  CheckCircle2,
  Clock,
  CreditCard,
  PackageCheck,
  PackageSearch,
  Search,
  Send,
  ShoppingBag,
  SlidersHorizontal,
  Truck,
  type LucideIcon,
} from "lucide-react";
import { AdminRoute } from "@/components/auth/AdminRoute";
import type {
  AdminOrderSummaryResponse,
  OrderStatus,
  OrderStatusSummaryResponse,
} from "@/types/order";
import { ORDER_STATUS_LABELS } from "@/types/order";
import { orderService } from "@/services/orderService";
import { useFeedbackModal } from "@/contexts/FeedbackModalContext";
import { formatCurrency, formatDateTime } from "@/utils/formatters";

const statusOptions: { value: "" | OrderStatus; label: string }[] = [
  { value: "", label: "Todos os status" },
  { value: "CLOSED", label: "Aguardando pagamento" },
  { value: "PAID", label: "Pagamento aprovado" },
  { value: "SHIPPED", label: "A caminho" },
  { value: "DELIVERED", label: "Entregue" },
  { value: "FINISHED", label: "Finalizado" },
  { value: "CANCELLED", label: "Cancelado" },
];

export default function AdminOrdersPage() {
  return (
    <AdminRoute>
      <AdminOrdersContent />
    </AdminRoute>
  );
}

function AdminOrdersContent() {
  const { showError } = useFeedbackModal();

  const [orders, setOrders] = useState<AdminOrderSummaryResponse[]>([]);
  const [summary, setSummary] = useState<OrderStatusSummaryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<"" | OrderStatus>("");
  const [search, setSearch] = useState("");

  const filteredOrders = useMemo(() => {
  const normalizedSearch = search.trim().toLowerCase();
  const visibleOrders = orders.filter((order) => order.status !== "PENDING");

  if (!normalizedSearch) return visibleOrders;

  return visibleOrders.filter((order) => {
    return [
      String(order.id),
      order.customerName,
      order.customerEmail,
      order.status,
      order.paymentMethod ?? "",
    ]
      .join(" ")
      .toLowerCase()
      .includes(normalizedSearch);
  });
}, [orders, search]);

  const totalRevenue = useMemo(() => {
    return filteredOrders
      .filter((order) =>
        ["PAID", "SHIPPED", "DELIVERED", "FINISHED"].includes(order.status)
      )
      .reduce((sum, order) => sum + order.totalAmount, 0);
  }, [filteredOrders]);

  const waitingActionCount = useMemo(() => {
    return filteredOrders.filter((order) =>
      ["PAID", "SHIPPED", "DELIVERED"].includes(order.status)
    ).length;
  }, [filteredOrders]);

  useEffect(() => {
    loadData();
  }, [selectedStatus]);

  async function loadData() {
    setLoading(true);

    try {
      const [ordersResponse, summaryResponse] = await Promise.all([
        orderService.findAllForAdmin(selectedStatus || undefined),
        orderService.getStatusSummary(),
      ]);

      setOrders(ordersResponse.filter((order) => order.status !== "PENDING"));
      setSummary(summaryResponse);
    } catch (error) {
      showError(error, "Erro ao carregar pedidos");
    } finally {
      setLoading(false);
    }
  }

  function clearFilters() {
    setSelectedStatus("");
    setSearch("");
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
                Admin • Pedidos
              </p>

              <div className="mt-4 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
                <div>
                  <h1 className="max-w-3xl text-4xl font-semibold leading-[1.02] tracking-[-0.05em] text-stone-950 md:text-5xl">
                    Gestão de pedidos
                  </h1>

                  <p className="mt-4 max-w-2xl text-base leading-7 text-stone-600">
                    Acompanhe pagamentos, envio, entrega e histórico dos pedidos
                    sem perder clareza nos valores e status.
                  </p>
                </div>

                <div className="rounded-[1.5rem] border border-stone-200 bg-[#fbfaf7] px-5 py-4">
                  <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-stone-500">
                    Visualização
                  </p>
                  <p className="mt-1 text-2xl font-semibold tracking-[-0.035em] text-stone-950">
                    {loading ? "..." : filteredOrders.length}
                  </p>
                </div>
              </div>

              <div className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard
                  label="Receita"
                  value={formatCurrency(totalRevenue)}
                  icon={CreditCard}
                />
                <StatCard
                  label="Pagos"
                  value={String(summary?.paid ?? 0)}
                  icon={CheckCircle2}
                />
                <StatCard
                  label="Em envio"
                  value={String(summary?.shipped ?? 0)}
                  icon={Truck}
                />
                <StatCard
                  label="Aguardam ação"
                  value={String(waitingActionCount)}
                  icon={Clock}
                  tone={waitingActionCount > 0 ? "warning" : "neutral"}
                />
              </div>
            </div>

            <aside className="border-t border-stone-200 bg-[#fbfaf7] p-6 xl:border-l xl:border-t-0 md:p-8">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#8f6f2e]">
                Operação
              </p>

              <h2 className="mt-3 text-2xl font-semibold tracking-[-0.035em] text-stone-950">
                Status dos pedidos
              </h2>

              <p className="mt-3 text-sm leading-6 text-stone-600">
                Resumo rápido do fluxo operacional da loja.
              </p>

              <div className="mt-6 grid gap-3">
                <StatusSummaryRow label="Aguardando pagamento" value={summary?.closed ?? 0} />
                <StatusSummaryRow label="Pagos" value={summary?.paid ?? 0} />
                <StatusSummaryRow label="A caminho" value={summary?.shipped ?? 0} />
                <StatusSummaryRow label="Entregues" value={summary?.delivered ?? 0} />
                <StatusSummaryRow label="Finalizados" value={summary?.finished ?? 0} />
                <StatusSummaryRow label="Cancelados" value={summary?.cancelled ?? 0} muted />
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
                Busque por pedido, cliente, e-mail ou método de pagamento.
              </p>
            </div>
          </div>

          <div className="grid gap-3 lg:grid-cols-[1fr_280px_auto]">
            <label className="relative block">
              <Search
                className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400"
                aria-hidden="true"
              />

              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar pedido, cliente ou e-mail"
                className="h-12 w-full rounded-full border border-stone-200 bg-[#fbfaf7] pl-11 pr-4 text-sm font-medium text-stone-950 outline-none transition placeholder:text-stone-400 hover:border-stone-300 focus:border-[#d8c28f] focus:bg-white"
              />
            </label>

            <select
              value={selectedStatus}
              onChange={(event) =>
                setSelectedStatus(event.target.value as "" | OrderStatus)
              }
              className="h-12 rounded-full border border-stone-200 bg-white px-4 text-sm font-semibold text-stone-950 outline-none transition hover:border-stone-300 focus:border-[#d8c28f]"
            >
              {statusOptions.map((option) => (
                <option key={option.value || "ALL"} value={option.value}>
                  {option.label}
                </option>
              ))}
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
                Pedidos cadastrados
              </p>

              <h2 className="mt-2 text-2xl font-semibold tracking-[-0.035em] text-stone-950">
                Lista administrativa
              </h2>
            </div>

            <p className="text-sm text-stone-500">
              {loading
                ? "Carregando pedidos..."
                : `${filteredOrders.length} pedido(s) nesta visualização`}
            </p>
          </div>

          {loading ? (
            <OrdersListSkeleton />
          ) : filteredOrders.length === 0 ? (
            <EmptyOrders onClear={clearFilters} />
          ) : (
            <div className="overflow-hidden rounded-[2rem] border border-stone-200 bg-white shadow-[0_20px_54px_rgba(41,37,36,0.05)]">
              <div className="hidden grid-cols-[120px_minmax(260px,1fr)_160px_150px_150px_170px_130px] border-b border-stone-200 bg-[#fbfaf7] px-5 py-4 text-[11px] font-bold uppercase tracking-[0.16em] text-stone-500 xl:grid">
                <span>Pedido</span>
                <span>Cliente</span>
                <span>Status</span>
                <span>Pagamento</span>
                <span>Total</span>
                <span>Data</span>
                <span className="text-right">Ação</span>
              </div>

              <div className="divide-y divide-stone-200">
                {filteredOrders.map((order) => (
                  <AdminOrderRow key={order.id} order={order} />
                ))}
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function AdminOrderRow({ order }: { order: AdminOrderSummaryResponse }) {
  const status = getOrderStatusTone(order.status);

  return (
    <article className="grid gap-0 p-4 transition hover:bg-[#fbfaf7] xl:grid-cols-[120px_minmax(260px,1fr)_160px_150px_150px_170px_130px] xl:items-center xl:px-5">
      <AdminCell label="Pedido">
        <div>
          <p className="whitespace-nowrap text-base font-semibold text-stone-950">
            #{order.id}
          </p>
          <p className="mt-1 text-xs text-stone-500">
            Cliente #{order.customerId}
          </p>
        </div>
      </AdminCell>

      <AdminCell label="Cliente">
        <div className="min-w-0">
          <p className="line-clamp-1 text-sm font-semibold text-stone-950">
            {order.customerName}
          </p>
          <p className="mt-1 line-clamp-1 text-sm text-stone-500">
            {order.customerEmail}
          </p>
        </div>
      </AdminCell>

      <AdminCell label="Status">
        <span
          className={`inline-flex whitespace-nowrap rounded-full px-3 py-1 text-xs font-bold ${status.badgeClass}`}
        >
          {ORDER_STATUS_LABELS[order.status]}
        </span>
      </AdminCell>

      <AdminCell label="Pagamento">
        <span className="whitespace-nowrap text-sm font-semibold text-stone-950">
          {formatPaymentMethod(order.paymentMethod)}
        </span>
      </AdminCell>

      <AdminCell label="Total">
        <span className="whitespace-nowrap text-base font-semibold text-stone-950">
          {formatCurrency(order.totalAmount)}
        </span>
      </AdminCell>

      <AdminCell label="Data">
        <span className="whitespace-nowrap text-sm text-stone-600">
          {formatDateTime(order.createdAt)}
        </span>
      </AdminCell>

      <div className="mt-5 flex justify-end xl:mt-0">
        <Link
          href={`/admin/pedidos/${order.id}`}
          className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-full border border-stone-200 bg-white px-4 text-sm font-semibold text-stone-950 transition hover:border-[#d8c28f] hover:bg-[#fbfaf7] xl:w-auto"
        >
          Detalhes
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>
    </article>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  tone = "neutral",
}: {
  label: string;
  value: string;
  icon: LucideIcon;
  tone?: "neutral" | "warning";
}) {
  const toneClass = {
    neutral: "text-stone-500 bg-[#fbfaf7]",
    warning: "text-[#8f6f2e] bg-[#f4ead0]",
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

      <p className="mt-4 whitespace-nowrap text-2xl font-semibold tracking-[-0.04em] text-stone-950">
        {value}
      </p>
    </div>
  );
}

function StatusSummaryRow({
  label,
  value,
  muted = false,
}: {
  label: string;
  value: number;
  muted?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-[1.25rem] border border-stone-200 bg-white px-4 py-3">
      <span className="text-sm font-semibold text-stone-600">{label}</span>
      <span
        className={`text-base font-semibold ${
          muted ? "text-stone-500" : "text-stone-950"
        }`}
      >
        {value}
      </span>
    </div>
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

function EmptyOrders({ onClear }: { onClear: () => void }) {
  return (
    <section className="rounded-[2rem] border border-stone-200 bg-white p-10 text-center shadow-sm">
      <PackageSearch
        className="mx-auto h-10 w-10 text-stone-400"
        aria-hidden="true"
      />

      <h2 className="mt-5 text-2xl font-semibold tracking-[-0.035em] text-stone-950">
        Nenhum pedido encontrado
      </h2>

      <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-stone-500">
        Ajuste os filtros ou limpe a busca para visualizar outros pedidos.
      </p>

      <button
        type="button"
        onClick={onClear}
        className="mt-7 inline-flex h-11 items-center justify-center rounded-full border border-stone-200 bg-white px-5 text-sm font-semibold text-stone-950 transition hover:border-[#d8c28f] hover:bg-[#fbfaf7]"
      >
        Limpar filtros
      </button>
    </section>
  );
}

function OrdersListSkeleton() {
  return (
    <div className="overflow-hidden rounded-[2rem] border border-stone-200 bg-white">
      {Array.from({ length: 6 }).map((_, index) => (
        <div
          key={index}
          className="grid gap-4 border-b border-stone-200 p-4 last:border-b-0 xl:grid-cols-[120px_minmax(260px,1fr)_160px_150px_150px_170px_130px]"
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

function getOrderStatusTone(status: OrderStatus) {
  if (status === "CANCELLED") {
    return {
      badgeClass: "bg-[var(--pc-danger-soft)] text-[var(--pc-danger)]",
      textClass: "text-[var(--pc-danger)]",
    };
  }

  if (status === "FINISHED") {
    return {
      badgeClass: "bg-[var(--pc-green-soft)] text-[var(--pc-green)]",
      textClass: "text-[var(--pc-green)]",
    };
  }

  if (status === "PAID" || status === "SHIPPED" || status === "DELIVERED") {
    return {
      badgeClass: "bg-[#f4ead0] text-[#8f6f2e]",
      textClass: "text-[#8f6f2e]",
    };
  }

  return {
    badgeClass: "bg-stone-100 text-stone-600",
    textClass: "text-stone-600",
  };
}

function formatPaymentMethod(method: string | null) {
  if (!method) return "Não definido";

  const labels: Record<string, string> = {
    CREDIT_CARD: "Crédito",
    DEBIT_CARD: "Débito",
    PIX: "PIX",
    BANK_SLIP: "Boleto",
  };

  return labels[method] ?? method;
}