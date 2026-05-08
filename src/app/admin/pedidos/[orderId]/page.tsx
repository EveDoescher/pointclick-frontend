"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  Ban,
  CheckCircle2,
  Clock,
  CreditCard,
  Loader2,
  MapPin,
  PackageCheck,
  PackageSearch,
  ReceiptText,
  Send,
  ShoppingBag,
  Truck,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import { AdminRoute } from "@/components/auth/AdminRoute";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import type { OrderResponse, OrderStatus } from "@/types/order";
import {
  ORDER_STATUS_DESCRIPTIONS,
  ORDER_STATUS_LABELS,
} from "@/types/order";
import { orderService } from "@/services/orderService";
import { buildPublicFileUrl } from "@/services/api";
import { useFeedbackModal } from "@/contexts/FeedbackModalContext";
import { formatCurrency, formatDateTime } from "@/utils/formatters";

type AdminOrderAction = "ship" | "deliver" | "cancel" | "reopen";

export default function AdminOrderDetailsPage() {
  return (
    <AdminRoute>
      <AdminOrderDetailsContent />
    </AdminRoute>
  );
}

function AdminOrderDetailsContent() {
  const params = useParams<{ orderId: string }>();
  const orderId = Number.parseInt(String(params.orderId), 10);

  const { showError } = useFeedbackModal();

  const [order, setOrder] = useState<OrderResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [pendingAction, setPendingAction] = useState<AdminOrderAction | null>(
    null
  );

  const timeline = useMemo(() => {
    if (!order) return [];

    return [
      {
        label: "Pedido criado",
        value: order.createdAt,
        active: true,
        icon: ShoppingBag,
      },
      {
        label: "Pedido fechado",
        value: order.closedAt,
        active: Boolean(order.closedAt),
        icon: ReceiptText,
      },
      {
        label: "Pagamento aprovado",
        value: order.paidAt,
        active: Boolean(order.paidAt),
        icon: CreditCard,
      },
      {
        label: "Pedido enviado",
        value: order.shippedAt,
        active: Boolean(order.shippedAt),
        icon: Send,
      },
      {
        label: "Entrega registrada",
        value: order.deliveredAt,
        active: Boolean(order.deliveredAt),
        icon: Truck,
      },
      {
        label: "Finalizado pelo cliente",
        value: order.finishedAt,
        active: Boolean(order.finishedAt),
        icon: CheckCircle2,
      },
    ];
  }, [order]);

  useEffect(() => {
    loadOrder();
  }, [orderId]);

  async function loadOrder() {
    if (!Number.isFinite(orderId)) return;

    setLoading(true);

    try {
      const response = await orderService.findByIdForAdmin(orderId);
      setOrder(response);
    } catch (error) {
      showError(error, "Erro ao carregar pedido");
    } finally {
      setLoading(false);
    }
  }

  async function executeAction() {
    if (!order || !pendingAction) return;

    setActionLoading(true);

    try {
      if (pendingAction === "ship") {
        await orderService.ship(order.id);
      }

      if (pendingAction === "deliver") {
        await orderService.deliver(order.id);
      }

      if (pendingAction === "cancel") {
        await orderService.cancel(order.id);
      }

      if (pendingAction === "reopen") {
        await orderService.reopenExpired(order.id);
      }

      setPendingAction(null);
      await loadOrder();
    } catch (error) {
      showError(error, "Erro ao atualizar pedido");
    } finally {
      setActionLoading(false);
    }
  }

  if (loading) {
    return <OrderDetailsSkeleton />;
  }

  if (!order) {
    return <OrderNotFound />;
  }

  const statusTone = getOrderStatusTone(order.status);
  const action = getActionConfig(pendingAction);

  return (
    <main className="min-h-screen bg-[#f8f7f3] px-4 py-8 lg:px-8 lg:py-10">
      <div className="mx-auto max-w-7xl">
        <Link
          href="/admin/pedidos"
          className="inline-flex items-center gap-2 text-sm font-semibold text-stone-600 transition hover:text-stone-950"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Voltar para pedidos
        </Link>

        <section className="mt-6 overflow-hidden rounded-[2rem] border border-stone-200 bg-white shadow-[0_20px_54px_rgba(41,37,36,0.06)]">
          <div className="grid gap-0 xl:grid-cols-[1fr_390px]">
            <div className="p-6 md:p-8">
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#8f6f2e]">
                Admin • Pedido #{order.id}
              </p>

              <div className="mt-4 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
                <div>
                  <h1 className="max-w-3xl text-4xl font-semibold leading-[1.02] tracking-[-0.05em] text-stone-950 md:text-5xl">
                    Detalhes do pedido
                  </h1>

                  <p className="mt-4 max-w-2xl text-base leading-7 text-stone-600">
                    Consulte dados do cliente, valores, itens, entrega e
                    histórico operacional do pedido.
                  </p>
                </div>

                <span
                  className={`inline-flex w-fit rounded-full px-4 py-2 text-sm font-bold ${statusTone.badgeClass}`}
                >
                  {ORDER_STATUS_LABELS[order.status]}
                </span>
              </div>

              <div className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <MetricCard
                  label="Total"
                  value={formatCurrency(order.totalAmount)}
                  icon={CreditCard}
                />
                <MetricCard
                  label="Produtos"
                  value={formatCurrency(order.itemsAmount)}
                  icon={ShoppingBag}
                />
                <MetricCard
                  label="Frete"
                  value={formatCurrency(order.freightAmount)}
                  icon={Truck}
                />
                <MetricCard
                  label="Desconto"
                  value={formatCurrency(order.discountAmount)}
                  icon={ReceiptText}
                />
              </div>
            </div>

            <aside className="border-t border-stone-200 bg-[#fbfaf7] p-6 xl:border-l xl:border-t-0 md:p-8">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#8f6f2e]">
                Status operacional
              </p>

              <h2 className="mt-3 text-2xl font-semibold tracking-[-0.035em] text-stone-950">
                {ORDER_STATUS_LABELS[order.status]}
              </h2>

              <p className="mt-3 text-sm leading-6 text-stone-600">
                {getAdminStatusDescription(order.status)}
              </p>

              <div className="mt-6 space-y-3">
                {order.status === "PAID" && (
                  <ActionButton
                    icon={Send}
                    label="Registrar envio"
                    onClick={() => setPendingAction("ship")}
                  />
                )}

                {order.status === "SHIPPED" && (
                  <ActionButton
                    icon={Truck}
                    label="Registrar entrega"
                    onClick={() => setPendingAction("deliver")}
                  />
                )}

                {order.status === "DELIVERED" && (
                  <InfoPanel
                    icon={Clock}
                    title="Aguardando confirmação do cliente"
                    description="A entrega foi registrada pela loja. A finalização depende da confirmação de recebimento pelo cliente."
                  />
                )}

                {(order.status === "PENDING" || order.status === "CLOSED") && (
                  <ActionButton
                    icon={Ban}
                    label="Cancelar pedido"
                    danger
                    onClick={() => setPendingAction("cancel")}
                  />
                )}

                {order.status === "CLOSED" && isReservationExpired(order) && (
                  <ActionButton
                    icon={Clock}
                    label="Reabrir reserva expirada"
                    onClick={() => setPendingAction("reopen")}
                  />
                )}

                {order.status === "FINISHED" && (
                  <InfoPanel
                    icon={CheckCircle2}
                    title="Pedido finalizado"
                    description="O cliente confirmou o recebimento. Nenhuma ação operacional é necessária."
                    success
                  />
                )}

                {order.status === "CANCELLED" && (
                  <InfoPanel
                    icon={Ban}
                    title="Pedido cancelado"
                    description="Este pedido foi cancelado e não permite novas ações operacionais."
                    danger
                  />
                )}
              </div>
            </aside>
          </div>
        </section>

        <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_390px]">
          <div className="space-y-6">
            <section className="rounded-[2rem] border border-stone-200 bg-white p-6 shadow-[0_20px_54px_rgba(41,37,36,0.04)] md:p-8">
              <SectionHeader
                eyebrow="Itens"
                title="Produtos do pedido"
                description={`${order.items.length} item(ns) vinculados a este pedido.`}
              />

              <div className="mt-6 overflow-hidden rounded-[1.5rem] border border-stone-200">
                <div className="hidden grid-cols-[1fr_100px_150px_150px] border-b border-stone-200 bg-[#fbfaf7] px-5 py-4 text-[11px] font-bold uppercase tracking-[0.16em] text-stone-500 lg:grid">
                  <span>Produto</span>
                  <span>Qtd.</span>
                  <span>Unitário</span>
                  <span>Subtotal</span>
                </div>

                <div className="divide-y divide-stone-200">
                  {order.items.map((item) => (
                    <OrderItemRow key={item.id} item={item} />
                  ))}
                </div>
              </div>
            </section>

            <section className="rounded-[2rem] border border-stone-200 bg-white p-6 shadow-[0_20px_54px_rgba(41,37,36,0.04)] md:p-8">
              <SectionHeader
                eyebrow="Linha do tempo"
                title="Histórico do pedido"
                description="Eventos principais registrados durante o fluxo."
              />

              <div className="mt-7 space-y-4">
                {timeline.map((event) => (
                  <TimelineItem key={event.label} event={event} />
                ))}
              </div>
            </section>
          </div>

          <aside className="space-y-6 xl:sticky xl:top-24 xl:self-start">
            <section className="rounded-[2rem] border border-stone-200 bg-white p-6 shadow-[0_20px_54px_rgba(41,37,36,0.04)] md:p-7">
              <SectionHeader
                eyebrow="Cliente"
                title="Dados do comprador"
                description="Informações principais vinculadas ao pedido."
              />

              <div className="mt-6 space-y-3">
                <InfoRow icon={UserRound} label="Cliente" value={order.userFullName} />
                <InfoRow icon={ShoppingBag} label="ID do cliente" value={`#${order.userId}`} />
                <InfoRow icon={Clock} label="Criado em" value={formatDateTime(order.createdAt)} />
                <InfoRow
                  icon={CreditCard}
                  label="Pagamento"
                  value={formatPaymentMethod(order.paymentMethod)}
                />
              </div>
            </section>

            <section className="rounded-[2rem] border border-stone-200 bg-white p-6 shadow-[0_20px_54px_rgba(41,37,36,0.04)] md:p-7">
              <SectionHeader
                eyebrow="Entrega"
                title="Endereço e frete"
                description="Dados usados no fechamento do pedido."
              />

              <div className="mt-6 rounded-[1.5rem] border border-stone-200 bg-[#fbfaf7] p-5">
                <div className="flex gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-[#8f6f2e] ring-1 ring-stone-200">
                    <MapPin className="h-4 w-4" aria-hidden="true" />
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-stone-950">
                      Endereço de entrega
                    </p>
                    <p className="mt-2 text-sm leading-6 text-stone-600">
                      {order.deliveryAddress ?? "Endereço não informado."}
                    </p>
                  </div>
                </div>
              </div>

              {order.reservationExpiresAt && (
                <div className="mt-4 rounded-[1.5rem] border border-stone-200 bg-[#fbfaf7] p-5">
                  <p className="text-sm font-semibold text-stone-950">
                    Reserva expira em
                  </p>
                  <p className="mt-1 text-sm text-stone-500">
                    {formatDateTime(order.reservationExpiresAt)}
                  </p>
                </div>
              )}
            </section>

            <section className="rounded-[2rem] border border-stone-200 bg-white p-6 shadow-[0_20px_54px_rgba(41,37,36,0.04)] md:p-7">
              <SectionHeader
                eyebrow="Valores"
                title="Resumo financeiro"
                description="Composição do total do pedido."
              />

              <div className="mt-6 space-y-3">
                <PriceRow label="Itens" value={order.itemsAmount} />
                <PriceRow label="Frete" value={order.freightAmount} />
                <PriceRow label="Desconto" value={order.discountAmount} />
                <div className="border-t border-stone-200 pt-3">
                  <PriceRow label="Total" value={order.totalAmount} strong />
                </div>
              </div>

              {order.couponCode && (
                <div className="mt-5 rounded-full bg-[#f4ead0] px-4 py-2 text-sm font-semibold text-[#8f6f2e]">
                  Cupom aplicado: {order.couponCode}
                </div>
              )}
            </section>
          </aside>
        </div>

        <ConfirmModal
          open={Boolean(pendingAction)}
          title={action.title}
          message={action.message}
          confirmLabel={action.confirmLabel}
          danger={action.danger}
          loading={actionLoading}
          onClose={() => {
            if (!actionLoading) setPendingAction(null);
          }}
          onConfirm={executeAction}
        />
      </div>
    </main>
  );
}

function OrderItemRow({
  item,
}: {
  item: OrderResponse["items"][number];
}) {
  const imageUrl = buildPublicFileUrl(item.productImageUrl);

  return (
    <article className="grid gap-0 p-4 lg:grid-cols-[1fr_100px_150px_150px] lg:items-center lg:px-5">
      <div className="flex min-w-0 gap-4">
        <div className="flex h-24 w-24 shrink-0 items-end justify-center rounded-[1.25rem] bg-[#f1efea] p-3">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={item.productName}
              className="h-full w-full object-contain object-bottom"
            />
          ) : (
            <PackageSearch className="mb-4 h-8 w-8 text-stone-400" />
          )}
        </div>

        <div className="min-w-0">
          <p className="line-clamp-1 text-[11px] font-bold uppercase tracking-[0.16em] text-[#8f6f2e]">
            {item.productBrand}
          </p>

          <p className="mt-2 line-clamp-2 text-base font-semibold leading-6 text-stone-950">
            {item.productName}
          </p>

          <p className="mt-1 text-sm text-stone-500">{item.productCategory}</p>
        </div>
      </div>

      <AdminCell label="Qtd.">
        <span className="whitespace-nowrap text-sm font-semibold text-stone-950">
          {item.quantity} un.
        </span>
      </AdminCell>

      <AdminCell label="Unitário">
        <span className="whitespace-nowrap text-sm font-semibold text-stone-950">
          {formatCurrency(item.unitPriceAtMoment)}
        </span>
      </AdminCell>

      <AdminCell label="Subtotal">
        <span className="whitespace-nowrap text-sm font-semibold text-stone-950">
          {formatCurrency(item.subtotal)}
        </span>
      </AdminCell>
    </article>
  );
}

function MetricCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: LucideIcon;
}) {
  return (
    <div className="rounded-[1.5rem] border border-stone-200 bg-[#fbfaf7] p-4">
      <div className="flex items-center justify-between gap-4">
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-stone-500">
          {label}
        </p>

        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-[#8f6f2e] ring-1 ring-stone-200">
          <Icon className="h-4 w-4" aria-hidden="true" />
        </span>
      </div>

      <p className="mt-4 whitespace-nowrap text-2xl font-semibold tracking-[-0.04em] text-stone-950">
        {value}
      </p>
    </div>
  );
}

function SectionHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="border-b border-stone-200 pb-5">
      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#8f6f2e]">
        {eyebrow}
      </p>

      <h2 className="mt-2 text-2xl font-semibold tracking-[-0.035em] text-stone-950">
        {title}
      </h2>

      <p className="mt-2 text-sm leading-6 text-stone-500">{description}</p>
    </div>
  );
}

function TimelineItem({
  event,
}: {
  event: {
    label: string;
    value: string | null;
    active: boolean;
    icon: LucideIcon;
  };
}) {
  const Icon = event.icon;

  return (
    <div className="flex gap-4">
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
          event.active
            ? "bg-[#f4ead0] text-[#8f6f2e]"
            : "bg-stone-100 text-stone-400"
        }`}
      >
        <Icon className="h-4 w-4" aria-hidden="true" />
      </div>

      <div className="min-w-0 border-b border-stone-200 pb-4">
        <p className="text-sm font-semibold text-stone-950">{event.label}</p>
        <p className="mt-1 text-sm text-stone-500">
          {event.value ? formatDateTime(event.value) : "Ainda não registrado"}
        </p>
      </div>
    </div>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <div className="flex gap-3 rounded-[1.25rem] border border-stone-200 bg-[#fbfaf7] p-4">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-[#8f6f2e] ring-1 ring-stone-200">
        <Icon className="h-4 w-4" aria-hidden="true" />
      </div>

      <div className="min-w-0">
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-stone-500">
          {label}
        </p>
        <p className="mt-1 break-words text-sm font-semibold text-stone-950">
          {value}
        </p>
      </div>
    </div>
  );
}

function PriceRow({
  label,
  value,
  strong = false,
}: {
  label: string;
  value: number;
  strong?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className={strong ? "font-semibold text-stone-950" : "text-stone-500"}>
        {label}
      </span>

      <span
        className={`whitespace-nowrap ${
          strong
            ? "text-lg font-semibold text-stone-950"
            : "text-sm font-semibold text-stone-950"
        }`}
      >
        {formatCurrency(value)}
      </span>
    </div>
  );
}

function ActionButton({
  icon: Icon,
  label,
  onClick,
  danger = false,
}: {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex h-11 w-full items-center justify-center gap-2 rounded-full px-5 text-sm font-semibold text-white transition ${
        danger
          ? "bg-[var(--pc-danger)] hover:bg-[var(--pc-danger-hover)]"
          : "bg-[#8f6f2e] hover:bg-[#76591f]"
      }`}
    >
      <Icon className="h-4 w-4" aria-hidden="true" />
      {label}
    </button>
  );
}

function InfoPanel({
  icon: Icon,
  title,
  description,
  success = false,
  danger = false,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  success?: boolean;
  danger?: boolean;
}) {
  const tone = danger
    ? "bg-[var(--pc-danger-soft)] text-[var(--pc-danger)]"
    : success
      ? "bg-[var(--pc-green-soft)] text-[var(--pc-green)]"
      : "bg-[#f4ead0] text-[#8f6f2e]";

  return (
    <div className="rounded-[1.5rem] border border-stone-200 bg-white p-5">
      <div className="flex gap-3">
        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${tone}`}>
          <Icon className="h-4 w-4" aria-hidden="true" />
        </div>

        <div>
          <p className="text-sm font-semibold text-stone-950">{title}</p>
          <p className="mt-1 text-sm leading-6 text-stone-500">{description}</p>
        </div>
      </div>
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
    <div className="mt-4 first:mt-0 lg:mt-0">
      <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.14em] text-stone-500 lg:hidden">
        {label}
      </p>
      {children}
    </div>
  );
}

function OrderDetailsSkeleton() {
  return (
    <main className="min-h-screen bg-[#f8f7f3] px-4 py-8 lg:px-8 lg:py-10">
      <div className="mx-auto max-w-7xl">
        <div className="h-5 w-40 animate-pulse rounded bg-stone-200" />
        <div className="mt-6 h-80 animate-pulse rounded-[2rem] bg-stone-200" />
        <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_390px]">
          <div className="h-96 animate-pulse rounded-[2rem] bg-stone-200" />
          <div className="h-96 animate-pulse rounded-[2rem] bg-stone-200" />
        </div>
      </div>
    </main>
  );
}

function OrderNotFound() {
  return (
    <main className="min-h-screen bg-[#f8f7f3] px-4 py-16 lg:px-8">
      <div className="mx-auto max-w-xl rounded-[2rem] border border-stone-200 bg-white p-10 text-center shadow-sm">
        <PackageSearch
          className="mx-auto h-10 w-10 text-stone-400"
          aria-hidden="true"
        />

        <h1 className="mt-5 text-2xl font-semibold tracking-[-0.035em] text-stone-950">
          Pedido não encontrado
        </h1>

        <p className="mt-3 text-stone-500">
          O pedido pode ter sido removido ou você não tem permissão para acessá-lo.
        </p>

        <Link
          href="/admin/pedidos"
          className="mt-6 inline-flex h-11 items-center justify-center rounded-full border border-stone-200 bg-white px-5 text-sm font-semibold text-stone-950 transition hover:border-[#d8c28f] hover:bg-[#fbfaf7]"
        >
          Voltar para pedidos
        </Link>
      </div>
    </main>
  );
}

function getOrderStatusTone(status: OrderStatus) {
  if (status === "CANCELLED") {
    return {
      badgeClass: "bg-[var(--pc-danger-soft)] text-[var(--pc-danger)]",
    };
  }

  if (status === "FINISHED") {
    return {
      badgeClass: "bg-[var(--pc-green-soft)] text-[var(--pc-green)]",
    };
  }

  if (status === "PAID" || status === "SHIPPED" || status === "DELIVERED") {
    return {
      badgeClass: "bg-[#f4ead0] text-[#8f6f2e]",
    };
  }

  return {
    badgeClass: "bg-stone-100 text-stone-600",
  };
}

function getAdminStatusDescription(status: OrderStatus) {
  if (status === "SHIPPED") {
    return "O pedido foi enviado. Registre a entrega quando a transportadora confirmar a entrega ao cliente.";
  }

  if (status === "DELIVERED") {
    return "A entrega foi registrada pela loja. Agora o cliente deve confirmar o recebimento para finalizar a compra.";
  }

  if (status === "FINISHED") {
    return "O cliente confirmou o recebimento e o pedido está finalizado.";
  }

  return ORDER_STATUS_DESCRIPTIONS[status];
}

function getActionConfig(action: AdminOrderAction | null) {
  if (action === "ship") {
    return {
      title: "Registrar envio?",
      message: "O pedido será marcado como enviado e o cliente será notificado.",
      confirmLabel: "Registrar envio",
      danger: false,
    };
  }

  if (action === "deliver") {
    return {
      title: "Registrar entrega?",
      message:
        "Esta ação registra a entrega logística. A confirmação final continua dependendo do cliente.",
      confirmLabel: "Registrar entrega",
      danger: false,
    };
  }

  if (action === "cancel") {
    return {
      title: "Cancelar pedido?",
      message:
        "O pedido será cancelado. Se houver reserva de estoque, ela será liberada.",
      confirmLabel: "Cancelar pedido",
      danger: true,
    };
  }

  if (action === "reopen") {
    return {
      title: "Reabrir reserva expirada?",
      message:
        "O pedido voltará para carrinho aberto e a reserva de estoque será liberada.",
      confirmLabel: "Reabrir pedido",
      danger: false,
    };
  }

  return {
    title: "",
    message: "",
    confirmLabel: "Confirmar",
    danger: false,
  };
}

function isReservationExpired(order: OrderResponse) {
  if (!order.reservationExpiresAt) return false;

  return new Date(order.reservationExpiresAt).getTime() < Date.now();
}

function formatPaymentMethod(method: string | null) {
  if (!method) return "Não definido";

  const labels: Record<string, string> = {
    CREDIT_CARD: "Cartão de crédito",
    DEBIT_CARD: "Cartão de débito",
    PIX: "PIX",
    BANK_SLIP: "Boleto",
  };

  return labels[method] ?? method;
}