"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { CheckCircle2, Laptop } from "lucide-react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import type { OrderResponse } from "@/types/order";
import {
  PAYMENT_METHOD_LABELS,
  PAYMENT_STATUS_LABELS,
  type CreatePaymentRequest,
  type PaymentMethod,
  type PaymentResponse,
} from "@/types/payment";
import { orderService } from "@/services/orderService";
import { paymentService } from "@/services/paymentService";
import { buildPublicFileUrl } from "@/services/api";
import { useFeedbackModal } from "@/contexts/FeedbackModalContext";
import { formatCurrency, formatDateTime } from "@/utils/formatters";

const paymentMethods: { value: PaymentMethod; label: string; description: string }[] = [
  {
    value: "PIX",
    label: "PIX",
    description: "Gera QR Code e link de confirmação em nova aba.",
  },
  {
    value: "BANK_SLIP",
    label: "Boleto",
    description: "Gera linha digitável e link de confirmação em nova aba.",
  },
  {
    value: "CREDIT_CARD",
    label: "Cartão de crédito",
    description: "Aprovação simulada imediata com parcelamento.",
  },
  {
    value: "DEBIT_CARD",
    label: "Cartão de débito",
    description: "Aprovação simulada imediata.",
  },
];

type CardFieldErrors = Partial<
  Record<"cardNumber" | "cardHolderName" | "expirationDate" | "cvv", string>
>;

export default function PaymentOrderPage() {
  return (
    <ProtectedRoute>
      <PaymentOrderContent />
    </ProtectedRoute>
  );
}

function PaymentOrderContent() {
  const params = useParams<{ orderId: string }>();
  const router = useRouter();

  const orderId = Number.parseInt(String(params.orderId), 10);

  const { showError, showInfo, showWarning } = useFeedbackModal();

  const [order, setOrder] = useState<OrderResponse | null>(null);
  const [payment, setPayment] = useState<PaymentResponse | null>(null);
  const [method, setMethod] = useState<PaymentMethod>("PIX");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [polling, setPolling] = useState(false);
  const [paymentSuccessOpen, setPaymentSuccessOpen] = useState(false);

  const [cardNumber, setCardNumber] = useState("");
  const [cardHolderName, setCardHolderName] = useState("");
  const [expirationDate, setExpirationDate] = useState("");
  const [cvv, setCvv] = useState("");
  const [installments, setInstallments] = useState(1);
  const [cardErrors, setCardErrors] = useState<CardFieldErrors>({});

  const canCreatePayment = order?.status === "CLOSED";
  const isCard = method === "CREDIT_CARD" || method === "DEBIT_CARD";

  const installmentOptions = useMemo(() => {
    if (!order) return [1];

    return Array.from({ length: 12 }).map((_, index) => index + 1);
  }, [order]);

  async function loadData() {
    if (!Number.isFinite(orderId)) return;

    setLoading(true);

    try {
      const orderResponse = await orderService.findById(orderId);
      setOrder(orderResponse);

      try {
        const paymentResponse = await paymentService.findByOrderId(orderId);
        setPayment(paymentResponse);
      } catch {
        setPayment(null);
      }
    } catch (error) {
      showError(error, "Erro ao carregar pagamento");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [orderId]);

  useEffect(() => {
    if (!payment || payment.status !== "PENDING") return;

    const intervalId = window.setInterval(async () => {
      setPolling(true);

      try {
        const [paymentResponse, orderResponse] = await Promise.all([
          paymentService.findByOrderId(orderId),
          orderService.findById(orderId),
        ]);

        setPayment(paymentResponse);
        setOrder(orderResponse);

        if (paymentResponse.status === "APPROVED") {
          setPaymentSuccessOpen(true);
          window.clearInterval(intervalId);
        }
      } catch {
        // polling silencioso
      } finally {
        setPolling(false);
      }
    }, 5000);

    return () => window.clearInterval(intervalId);
  }, [payment?.id, payment?.status, orderId]);

  async function handleCreatePayment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!order) return;

    if (!canCreatePayment) {
      showWarning("Este pedido não está disponível para pagamento.");
      return;
    }

    if (isCard) {
      const validation = validateCardFields({
        cardNumber,
        cardHolderName,
        expirationDate,
        cvv,
      });

      setCardErrors(validation.errors);

      if (!validation.valid) {
        return;
      }
    }

    setPaymentLoading(true);

    try {
      const request: CreatePaymentRequest = {
        paymentMethod: method,
        notes: notes.trim() || null,
      };

      if (isCard) {
        request.cardNumber = onlyDigits(cardNumber);
        request.cardHolderName = cardHolderName.trim();
        request.expirationDate = expirationDate.trim();
        request.cvv = onlyDigits(cvv);
        request.installments = method === "CREDIT_CARD" ? installments : 1;
      }

      const response = await paymentService.createPayment(order.id, request);
      setPayment(response);

      const updatedOrder = await orderService.findById(order.id);
      setOrder(updatedOrder);

      if (response.status === "APPROVED") {
        setPaymentSuccessOpen(true);
      }
    } catch (error) {
      showError(error, "Erro ao criar pagamento");
    } finally {
      setPaymentLoading(false);
    }
  }

  function openConfirmationUrl(url: string | null) {
    if (!url) {
      showInfo("URL de confirmação não disponível.");
      return;
    }

    window.open(url, "_blank", "noopener,noreferrer");
  }

  function handlePaymentSuccessClose() {
    setPaymentSuccessOpen(false);
    router.push(`/pedidos/${orderId}`);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFAF9] px-4 py-12 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-8 lg:grid-cols-[1fr_420px]">
            <div className="h-[560px] animate-pulse rounded-[2.5rem] bg-stone-200/90" />
            <div className="h-[560px] animate-pulse rounded-[2.5rem] bg-stone-200/90" />
          </div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-[#FAFAF9] px-4 py-12 lg:px-8">
        <div className="mx-auto max-w-3xl rounded-[2rem] border border-stone-200 bg-white p-10 text-center shadow-[0_10px_28px_rgba(28,25,23,0.06)]">
          <h1 className="font-[family-name:var(--font-rubik)] text-3xl font-semibold text-stone-900">
            Pedido não encontrado
          </h1>
          <p className="mt-3 text-stone-500">
            Não foi possível carregar os dados deste pedido.
          </p>
          <Link
            href="/pedidos"
            className="mt-8 inline-flex rounded-full border border-[var(--pc-purple)] bg-[var(--pc-purple)] px-6 py-4 text-sm font-semibold text-white shadow-sm transition hover:bg-[var(--pc-purple-hover)]"
          >
            Ver meus pedidos
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAF9] px-4 py-10 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <section className="rounded-[2rem] border border-stone-200 bg-white p-6 shadow-[0_10px_28px_rgba(28,25,23,0.05)] md:p-8">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-700">
                Pagamento
              </p>
              <h1 className="mt-3 font-[family-name:var(--font-rubik)] text-4xl font-semibold tracking-[-0.04em] text-stone-900 md:text-5xl">
                Pedido #{order.id}
              </h1>
              <p className="mt-4 max-w-2xl leading-7 text-stone-600">
                Escolha uma forma de pagamento simulada. PIX e boleto geram uma
                página de confirmação em nova aba.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href={`/pedidos/${order.id}`}
                className="rounded-2xl bg-[var(--pc-purple)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[var(--pc-purple-hover)]"
              >
                Ver pedido
              </Link>
            </div>
          </div>
        </section>

        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_420px]">
          <section className="space-y-6">
            {payment ? (
              <PaymentResultCard
                payment={payment}
                onOpenConfirmationUrl={openConfirmationUrl}
              />
            ) : (
              <form
                onSubmit={handleCreatePayment}
                className="rounded-[2.5rem] border border-stone-200 bg-white p-6 shadow-sm md:p-8"
              >
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
                    Método
                  </p>
                  <h2 className="mt-3 text-2xl font-semibold text-stone-900">
                    Escolha como pagar
                  </h2>
                </div>

                {!canCreatePayment && (
                  <div className="mt-6 rounded-[2rem] border border-amber-200 bg-amber-50 p-5">
                    <p className="text-sm font-semibold text-amber-800">
                      Pedido não está fechado
                    </p>
                    <p className="mt-2 text-sm leading-6 text-amber-700">
                      Apenas pedidos com status CLOSED podem receber pagamento.
                      Status atual: {order.status}.
                    </p>
                  </div>
                )}

                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  {paymentMethods.map((option) => (
                    <label
                      key={option.value}
                      className={`cursor-pointer rounded-[1.5rem] border p-5 transition ${
                        method === option.value
                          ? "border-[var(--pc-purple)] bg-[var(--pc-purple)] text-white"
                          : "border-stone-200 bg-white text-stone-800 hover:border-[var(--pc-purple)]"
                      }`}
                    >
                      <input
                        type="radio"
                        name="paymentMethod"
                        value={option.value}
                        checked={method === option.value}
                        onChange={() => {
                          setMethod(option.value);
                          setCardErrors({});
                        }}
                        className="sr-only"
                      />

                      <p className="font-semibold">{option.label}</p>
                      <p
                        className={`mt-2 text-sm leading-6 ${
                          method === option.value ? "text-white/80" : "text-stone-500"
                        }`}
                      >
                        {option.description}
                      </p>
                    </label>
                  ))}
                </div>

                {isCard && (
                  <div className="mt-6 rounded-[2rem] border border-stone-200 bg-[#F7F3EC] p-5">
                    <p className="text-sm font-semibold text-stone-900">
                      Dados do cartão simulado
                    </p>

                    <div className="mt-4 grid gap-4 md:grid-cols-2">
                      <label className="block md:col-span-2">
                        <span className="text-sm font-semibold text-stone-700">
                          Número do cartão
                        </span>
                        <input
                          value={cardNumber}
                          onChange={(event) => {
                            setCardNumber(formatCardNumberInput(event.target.value));
                            setCardErrors((current) => ({
                              ...current,
                              cardNumber: undefined,
                            }));
                          }}
                          inputMode="numeric"
                          autoComplete="cc-number"
                          maxLength={19}
                          placeholder="4111 1111 1111 1111"
                          className="mt-2 w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm font-medium outline-none focus:border-[var(--pc-purple)]"
                        />
                        {cardErrors.cardNumber && (
                          <p className="mt-2 text-sm font-medium text-[var(--pc-danger)]">
                            {cardErrors.cardNumber}
                          </p>
                        )}
                      </label>

                      <label className="block md:col-span-2">
                        <span className="text-sm font-semibold text-stone-700">
                          Nome do titular
                        </span>
                        <input
                          value={cardHolderName}
                          onChange={(event) => {
                            setCardHolderName(event.target.value.toUpperCase());
                            setCardErrors((current) => ({
                              ...current,
                              cardHolderName: undefined,
                            }));
                          }}
                          autoComplete="cc-name"
                          maxLength={80}
                          placeholder="ANA SOUZA"
                          className="mt-2 w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm font-medium outline-none focus:border-[var(--pc-purple)]"
                        />
                        {cardErrors.cardHolderName && (
                          <p className="mt-2 text-sm font-medium text-[var(--pc-danger)]">
                            {cardErrors.cardHolderName}
                          </p>
                        )}
                      </label>

                      <label className="block">
                        <span className="text-sm font-semibold text-stone-700">
                          Validade
                        </span>
                        <input
                          value={expirationDate}
                          onChange={(event) => {
                            setExpirationDate(
                              formatExpirationDateInput(event.target.value),
                            );
                            setCardErrors((current) => ({
                              ...current,
                              expirationDate: undefined,
                            }));
                          }}
                          inputMode="numeric"
                          autoComplete="cc-exp"
                          maxLength={5}
                          placeholder="MM/AA"
                          className="mt-2 w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm font-medium outline-none focus:border-[var(--pc-purple)]"
                        />
                        {cardErrors.expirationDate && (
                          <p className="mt-2 text-sm font-medium text-[var(--pc-danger)]">
                            {cardErrors.expirationDate}
                          </p>
                        )}
                      </label>

                      <label className="block">
                        <span className="text-sm font-semibold text-stone-700">
                          CVV
                        </span>
                        <input
                          value={cvv}
                          onChange={(event) => {
                            setCvv(onlyDigits(event.target.value).slice(0, 4));
                            setCardErrors((current) => ({
                              ...current,
                              cvv: undefined,
                            }));
                          }}
                          inputMode="numeric"
                          autoComplete="cc-csc"
                          maxLength={4}
                          placeholder="123"
                          className="mt-2 w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm font-medium outline-none focus:border-[var(--pc-purple)]"
                        />
                        {cardErrors.cvv && (
                          <p className="mt-2 text-sm font-medium text-[var(--pc-danger)]">
                            {cardErrors.cvv}
                          </p>
                        )}
                      </label>

                      {method === "CREDIT_CARD" && (
                        <label className="block md:col-span-2">
                          <span className="text-sm font-semibold text-stone-700">
                            Parcelas
                          </span>
                          <select
                            value={installments}
                            onChange={(event) =>
                              setInstallments(Number(event.target.value))
                            }
                            className="mt-2 w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm font-bold outline-none focus:border-[var(--pc-purple)]"
                          >
                            {installmentOptions.map((option) => (
                              <option key={option} value={option}>
                                {option}x de{" "}
                                {formatCurrency(order.totalAmount / option)}
                              </option>
                            ))}
                          </select>
                        </label>
                      )}
                    </div>
                  </div>
                )}

                <label className="mt-6 block">
                  <span className="text-sm font-semibold text-stone-700">
                    Observações para entrega
                  </span>
                  <textarea
                    value={notes}
                    onChange={(event) => setNotes(event.target.value)}
                    rows={4}
                    placeholder="Ex.: entregar em horário comercial"
                    className="mt-2 w-full resize-none rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm font-medium outline-none focus:border-[var(--pc-purple)]"
                  />
                </label>

                <button
                  type="submit"
                  disabled={!canCreatePayment || paymentLoading}
                  className="mt-6 w-full rounded-2xl bg-[var(--pc-purple)] px-5 py-4 text-sm font-semibold text-white transition hover:bg-[var(--pc-purple-hover)] disabled:cursor-not-allowed disabled:bg-stone-300"
                >
                  {paymentLoading ? "Gerando pagamento..." : "Gerar pagamento"}
                </button>
              </form>
            )}
          </section>

          <aside className="h-fit rounded-[2.5rem] border border-stone-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-700">
              Resumo
            </p>

            <h2 className="mt-3 text-2xl font-semibold text-stone-900">
              Total {formatCurrency(order.totalAmount)}
            </h2>

            <div className="mt-6 space-y-3 rounded-[2rem] bg-[#F7F3EC] p-5">
              <SummaryRow label="Itens" value={formatCurrency(order.itemsAmount)} />
              <SummaryRow
                label="Desconto"
                value={`-${formatCurrency(order.discountAmount)}`}
              />
              <SummaryRow label="Frete" value={formatCurrency(order.freightAmount)} />
              <div className="border-t border-stone-200 pt-4">
                <SummaryRow
                  label="Total"
                  value={formatCurrency(order.totalAmount)}
                  strong
                />
              </div>
            </div>

            <div className="mt-6 rounded-[2rem] border border-stone-200 p-5">
              <p className="text-sm font-semibold text-stone-900">Status</p>
              <p className="mt-2 text-sm font-bold text-stone-600">
                Pedido: <span className="text-stone-900">{order.status}</span>
              </p>
              <p className="mt-1 text-sm font-bold text-stone-600">
                Pagamento:{" "}
                <span className="text-stone-900">
                  {payment ? PAYMENT_STATUS_LABELS[payment.status] : "Não criado"}
                </span>
              </p>
              {order.closedAt && (
                <p className="mt-1 text-xs text-stone-500">
                  Fechado em {formatDateTime(order.closedAt)}
                </p>
              )}
            </div>

            <div className="mt-6 space-y-3">
              {order.items.map((item) => {
                const imageUrl = buildPublicFileUrl(item.productImageUrl);

                return (
                  <div
                    key={item.id}
                    className="flex gap-3 rounded-2xl border border-stone-200 p-3"
                  >
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[#F7F3EC]">
                      {imageUrl ? (
                        <img
                          src={imageUrl}
                          alt={item.productName}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <Laptop className="h-5 w-5 text-stone-500" aria-hidden="true" />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-1 text-sm font-semibold text-stone-900">
                        {item.productName}
                      </p>
                      <p className="mt-1 text-xs font-bold text-stone-500">
                        {item.quantity}x • {formatCurrency(item.subtotal)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </aside>
        </div>

        {paymentSuccessOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-stone-950/45 px-4 backdrop-blur-sm">
            <div className="w-full max-w-md overflow-hidden rounded-[2rem] border border-stone-200 bg-white shadow-[0_28px_80px_rgba(46,39,31,0.18)]">
              <div className="p-6">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--pc-green-soft)] text-[var(--pc-green)]">
                    <CheckCircle2 className="h-6 w-6" aria-hidden="true" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <span className="inline-flex rounded-full bg-[var(--pc-green-soft)] px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-[var(--pc-green)]">
                      Pagamento confirmado
                    </span>

                    <h2 className="mt-4 text-2xl font-semibold tracking-[-0.035em] text-stone-950">
                      Tudo certo com o pagamento
                    </h2>

                    <p className="mt-3 leading-7 text-stone-600">
                      O pedido foi atualizado. Você será direcionado para os detalhes da compra.
                    </p>
                  </div>
                </div>

                <div className="mt-8 flex justify-end">
                  <button
                    type="button"
                    onClick={handlePaymentSuccessClose}
                    className="rounded-full bg-[#8f6f2e] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#76591f]"
                  >
                    OK
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

function PaymentResultCard({
  payment,
  onOpenConfirmationUrl,
}: {
  payment: PaymentResponse;
  onOpenConfirmationUrl: (url: string | null) => void;
}) {
  const isPix = payment.method === "PIX";
  const isBankSlip = payment.method === "BANK_SLIP";
  const qrOrBarcode = isPix ? payment.pixQrCodeBase64 : payment.bankSlipBarCodeBase64;
  const confirmationUrl = isPix
    ? payment.pixConfirmationUrl
    : payment.bankSlipConfirmationUrl;

  return (
    <section className="rounded-[2.5rem] border border-stone-200 bg-white p-6 shadow-sm md:p-8">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
          Pagamento criado
        </p>
        <h2 className="mt-3 text-3xl font-semibold text-stone-900">
          {PAYMENT_METHOD_LABELS[payment.method]} • {PAYMENT_STATUS_LABELS[payment.status]}
        </h2>
        <p className="mt-3 leading-7 text-stone-600">
          Valor: <span className="font-semibold">{formatCurrency(payment.amount)}</span>
        </p>
      </div>

      {payment.status === "APPROVED" && (
        <div className="mt-6 rounded-[2rem] border border-emerald-200 bg-emerald-50 p-5">
          <p className="font-semibold text-emerald-800">Pagamento aprovado</p>
          <p className="mt-2 text-sm leading-6 text-emerald-700">
            Seu pedido já foi atualizado e agora aguarda envio.
          </p>
        </div>
      )}

      {payment.status === "PENDING" && (isPix || isBankSlip) && (
        <div className="mt-8 grid gap-6 lg:grid-cols-[260px_1fr]">
          <div className="flex min-h-64 items-center justify-center rounded-[2rem] border border-stone-200 bg-[#F7F3EC] p-5">
            {qrOrBarcode ? (
              <img
                src={qrOrBarcode}
                alt={isPix ? "QR Code PIX" : "Código de barras do boleto"}
                className="max-h-56 w-full object-contain"
              />
            ) : (
              <span className="text-sm font-bold text-stone-500">
                Código não disponível
              </span>
            )}
          </div>

          <div>
            <p className="text-sm font-semibold text-stone-900">
              {isPix ? "Código PIX" : "Linha digitável"}
            </p>

            <div className="mt-3 rounded-2xl bg-[#F7F3EC] p-4">
              <p className="break-all text-sm font-bold leading-6 text-stone-700">
                {isPix ? payment.pixCode : payment.digitableLine}
              </p>
            </div>

            <button
              type="button"
              onClick={() => onOpenConfirmationUrl(confirmationUrl)}
              className="mt-5 w-full rounded-2xl bg-[var(--pc-purple)] px-5 py-4 text-sm font-semibold text-white transition hover:bg-[var(--pc-purple-hover)]"
            >
              Abrir confirmação em nova aba
            </button>

            <p className="mt-4 text-sm leading-6 text-stone-500">
              Após confirmar na nova aba, esta tela atualiza automaticamente em
              alguns segundos.
            </p>
          </div>
        </div>
      )}
    </section>
  );
}

function onlyDigits(value: string) {
  return value.replace(/\D/g, "");
}

function formatCardNumberInput(value: string) {
  const digits = onlyDigits(value).slice(0, 16);

  return digits.replace(/(.{4})/g, "$1 ").trim();
}

function formatExpirationDateInput(value: string) {
  const digits = onlyDigits(value).slice(0, 4);

  if (digits.length <= 2) {
    return digits;
  }

  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

function validateCardFields({
  cardNumber,
  cardHolderName,
  expirationDate,
  cvv,
}: {
  cardNumber: string;
  cardHolderName: string;
  expirationDate: string;
  cvv: string;
}) {
  const errors: CardFieldErrors = {};
  const cardDigits = onlyDigits(cardNumber);
  const cvvDigits = onlyDigits(cvv);

  if (cardDigits.length !== 16) {
    errors.cardNumber = "Informe os 16 números do cartão.";
  }

  if (!cardHolderName.trim()) {
    errors.cardHolderName = "Informe o nome do titular do cartão.";
  }

  const expirationError = validateExpirationDate(expirationDate);

  if (expirationError) {
    errors.expirationDate = expirationError;
  }

  if (cvvDigits.length < 3 || cvvDigits.length > 4) {
    errors.cvv = "Informe um CVV com 3 ou 4 números.";
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

function validateExpirationDate(value: string) {
  const match = /^(\d{2})\/(\d{2})$/.exec(value.trim());

  if (!match) {
    return "Informe a validade no formato MM/AA.";
  }

  const month = Number(match[1]);
  const year = 2000 + Number(match[2]);

  if (month < 1 || month > 12) {
    return "Informe um mês válido entre 01 e 12.";
  }

  const now = new Date();
  const expirationLimit = new Date(year, month, 0, 23, 59, 59, 999);

  if (expirationLimit < now) {
    return "Informe uma validade que ainda não venceu.";
  }

  return null;
}

function SummaryRow({
  label,
  value,
  strong = false,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span
        className={`text-sm ${
          strong ? "font-semibold text-stone-900" : "font-bold text-stone-500"
        }`}
      >
        {label}
      </span>
      <span
        className={`text-right ${
          strong ? "text-xl font-semibold text-stone-900" : "text-sm font-semibold text-stone-800"
        }`}
      >
        {value}
      </span>
    </div>
  );
}