"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Package } from "lucide-react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import type { OrderSummaryResponse, OrderStatus } from "@/types/order";
import { PAYMENT_METHOD_LABELS } from "@/types/payment";
import { ORDER_STATUS_LABELS } from "@/types/order";
import { orderService } from "@/services/orderService";
import { useFeedbackModal } from "@/contexts/FeedbackModalContext";
import { formatCurrency, formatDateTime } from "@/utils/formatters";

const statusOptions: { value: OrderStatus | "ALL"; label: string }[] = [
  { value: "ALL", label: "Todos" },
  { value: "CLOSED", label: "Aguardando pagamento" },
  { value: "PAID", label: "Pago" },
  { value: "SHIPPED", label: "A caminho" },
  { value: "DELIVERED", label: "Entregue" },
  { value: "FINISHED", label: "Finalizado" },
  { value: "CANCELLED", label: "Cancelado" },
];

export default function MyOrdersPage() {
  return (
    <ProtectedRoute>
      <MyOrdersContent />
    </ProtectedRoute>
  );
}

function MyOrdersContent() {
  const { showError } = useFeedbackModal();

  const [orders, setOrders] = useState<OrderSummaryResponse[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus | "ALL">(
    "ALL"
  );
  const [loading, setLoading] = useState(true);
  const visibleOrders = orders.filter((order) => order.status !== "PENDING");

  const filteredOrders =
    selectedStatus === "ALL"
      ? visibleOrders
      : visibleOrders.filter((order) => order.status === selectedStatus);

  async function loadOrders() {
    setLoading(true);

    try {
      const response = await orderService.findMyOrders();
      setOrders(response.filter((order) => order.status !== "PENDING"));
    } catch (error) {
      showError(error, "Erro ao carregar pedidos");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadOrders();
  }, []);

  return (
    <div className="min-h-screen bg-[#FAFAF9] px-4 py-10 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="border-b border-stone-200 pb-8">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                Conta
              </p>
              <h1 className="mt-2 font-[family-name:var(--font-rubik)] text-3xl font-semibold tracking-[-0.04em] text-stone-900 sm:text-4xl">
                Meus pedidos
                {!loading && (
                  <span className="ml-2 text-lg font-normal text-stone-500">
                    ({filteredOrders.length})
                  </span>
                )}
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-stone-600">
                Lista enxuta: status, total e pagamento. Abra o pedido para ver
                itens, entrega e histórico.
              </p>
            </div>
            <Link
              href="/produtos"
              className="pc-btn pc-btn-secondary shrink-0 text-sm"
            >
              Continuar comprando
            </Link>
          </div>
        </header>

        <div className="mt-6 flex gap-2 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {statusOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setSelectedStatus(option.value)}
              className={`whitespace-nowrap rounded-full border px-4 py-2.5 text-sm font-medium transition ${
                selectedStatus === option.value
                  ? "border-stone-400 bg-[#ebe5d7] text-stone-900 shadow-sm"
                  : "border-stone-200 bg-white text-stone-600 hover:border-stone-300 hover:text-stone-900"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="mt-8 space-y-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="h-36 animate-pulse rounded-[2rem] bg-stone-200/90"
              />
            ))}
          </div>
        ) : filteredOrders.length === 0 ? (
          <section className="mt-8 rounded-[2rem] border border-stone-200 bg-white p-10 text-center shadow-[0_18px_34px_rgba(28,25,23,0.06)]">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[2rem] bg-[#F7F3EC] text-stone-500">
              <Package className="h-9 w-9" aria-hidden="true" />
            </div>

            <h2 className="mt-7 font-[family-name:var(--font-rubik)] text-2xl font-semibold text-stone-900">
              Nenhum pedido encontrado
            </h2>

            <p className="mt-3 text-stone-600">
              {selectedStatus === "ALL"
                ? "Você ainda não possui pedidos."
                : "Não há pedidos neste status."}
            </p>

            <Link
              href="/produtos"
              className="mt-7 inline-flex rounded-full border border-[var(--pc-purple)] bg-[var(--pc-purple)] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[var(--pc-purple-hover)]"
            >
              Ver produtos
            </Link>
          </section>
        ) : (
          <div className="mt-2 space-y-4">
            {filteredOrders.map((order) => (
              <article
                key={order.id}
                className="rounded-[1.75rem] border border-stone-200 bg-white p-5 shadow-[0_8px_24px_rgba(28,25,23,0.04)] transition hover:border-stone-300 md:p-6"
              >
                <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="font-[family-name:var(--font-rubik)] text-2xl font-semibold tracking-[-0.03em] text-stone-900">
                        Pedido #{order.id}
                      </h2>

                      <StatusBadge status={order.status} />
                    </div>

                    <p className="mt-2 text-sm font-medium text-stone-500">
                      Criado em {formatDateTime(order.createdAt)}
                    </p>
                  </div>

                  <div className="grid min-w-0 gap-3 sm:grid-cols-3 lg:w-[min(100%,520px)] lg:shrink-0">
                    <MiniInfo
                      label="Itens"
                      value={formatCurrency(order.itemsAmount)}
                    />
                    <MiniInfo
                      label="Desconto"
                      value={`-${formatCurrency(order.discountAmount)}`}
                    />
                    <MiniInfo
                      label="Total"
                      value={formatCurrency(order.totalAmount)}
                      strong
                    />
                  </div>
                </div>

                <div className="mt-5 flex flex-col gap-3 border-t border-stone-200/80 pt-5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="text-sm font-semibold text-stone-500">
                    Pagamento:{" "}
                    <span className="text-stone-800">
                      {order.paymentMethod
                        ? PAYMENT_METHOD_LABELS[order.paymentMethod]
                        : "Não informado"}
                    </span>
                    {order.couponCode && (
                      <>
                        {" "}
                        • Cupom:{" "}
                        <span className="text-stone-800">
                          {order.couponCode}
                        </span>
                      </>
                    )}
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row">
                    {order.status === "CLOSED" && (
                      <Link
                        href={`/pagamento/${order.id}`}
                        className="pc-btn pc-btn-accent px-5 py-2.5 text-center text-sm"
                      >
                        Pagar agora
                      </Link>
                    )}

                    <Link
                      href={`/pedidos/${order.id}`}
                      className="pc-btn pc-btn-secondary px-5 py-2.5 text-center text-sm"
                    >
                      Ver detalhes
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: OrderStatus }) {
  const styles: Record<OrderStatus, string> = {
    PENDING: "bg-stone-100 text-stone-700",
    CLOSED: "border border-stone-200 bg-[#f4ecda] text-stone-800",
    PAID: "bg-emerald-100 text-emerald-700",
    SHIPPED: "bg-blue-100 text-blue-700",
    DELIVERED: "bg-cyan-100 text-cyan-700",
    FINISHED: "border border-stone-300 bg-stone-100 text-stone-800",
    CANCELLED: "bg-rose-100 text-rose-700",
  };

  return (
    <span
      className={`rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] ${styles[status]}`}
    >
      {ORDER_STATUS_LABELS[status]}
    </span>
  );
}

function MiniInfo({
  label,
  value,
  strong = false,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div className="min-w-0 rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3">
      <p className="text-xs font-bold uppercase tracking-[0.12em] text-stone-500">
        {label}
      </p>
      <p
        className={`mt-1 break-words tabular-nums ${
          strong
            ? "font-[family-name:var(--font-rubik)] text-lg font-semibold text-stone-900"
            : "text-sm font-semibold text-stone-700"
        }`}
      >
        {value}
      </p>
    </div>
  );
}