"use client";

import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Laptop, Star, X } from "lucide-react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import type { OrderResponse, OrderStatus } from "@/types/order";
import { ORDER_STATUS_DESCRIPTIONS, ORDER_STATUS_LABELS } from "@/types/order";
import { orderService } from "@/services/orderService";
import type { ReviewResponse } from "@/types/review";
import { reviewService } from "@/services/reviewService";
import { buildPublicFileUrl } from "@/services/api";
import { useFeedbackModal } from "@/contexts/FeedbackModalContext";
import { formatCurrency, formatDateTime } from "@/utils/formatters";

type ReviewFormState = {
  rating: number;
  comment: string;
  images: File[];
  previewUrls: string[];
  loading: boolean;
};

const MAX_REVIEW_IMAGE_SIZE_MB = 5;
const MAX_REVIEW_IMAGE_SIZE_BYTES = MAX_REVIEW_IMAGE_SIZE_MB * 1000 * 1000;
const MAX_REVIEW_IMAGES = 5;

export default function OrderDetailsPage() {
  return (
    <ProtectedRoute>
      <OrderDetailsContent />
    </ProtectedRoute>
  );
}

function OrderDetailsContent() {
  const params = useParams<{ orderId: string }>();
  const router = useRouter();

  const orderId = Number.parseInt(String(params.orderId), 10);

  const { showError, showSuccess, showWarning } = useFeedbackModal();

  const [order, setOrder] = useState<OrderResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [myReviews, setMyReviews] = useState<ReviewResponse[]>([]);
  const [reviewForms, setReviewForms] = useState<
    Record<number, ReviewFormState>
  >({});
  const [reviewError, setReviewError] = useState("");
  const [reviewSuccess, setReviewSuccess] = useState("");
  const [selectedReviewImage, setSelectedReviewImage] = useState<string | null>(null);
  const hasScrolledToReview = useRef(false);

  async function loadOrder() {
    if (!Number.isFinite(orderId)) return;

    setLoading(true);

    try {
      const response = await orderService.findById(orderId);
      setOrder(response);
    } catch (error) {
      showError(error, "Erro ao carregar pedido");
    } finally {
      setLoading(false);
    }
  }

  async function loadMyReviews() {
    try {
      const response = await reviewService.findMyReviews();
      setMyReviews(response);
    } catch {
      setMyReviews([]);
    }
  }

  useEffect(() => {
    loadOrder();
    loadMyReviews();
  }, [orderId]);

  async function handleConfirmDelivery() {
    if (!order) return;

    if (order.status !== "DELIVERED") {
      showWarning("Este pedido ainda não está disponível para confirmação.");
      return;
    }

    setActionLoading(true);

    try {
      const response = await orderService.confirmDelivery(order.id);
      setOrder(response);
      showSuccess("Recebimento confirmado com sucesso.");
    } catch (error) {
      showError(error, "Erro ao confirmar recebimento");
    } finally {
      setActionLoading(false);
    }
  }

  useEffect(() => {
    if (hasScrolledToReview.current) return;
    if (typeof window === "undefined") return;
    if (window.location.hash !== "#avaliacao") return;
    if (loading || !order || order.status !== "FINISHED") return;

    const timeoutId = window.setTimeout(() => {
      const section = document.getElementById("avaliacao");

      if (section) {
        section.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });

        hasScrolledToReview.current = true;
      }
    }, 150);

    return () => window.clearTimeout(timeoutId);
  }, [loading, order]);

  useEffect(() => {
    return () => {
      Object.values(reviewForms).forEach((form) => {
        form.previewUrls.forEach((url) => URL.revokeObjectURL(url));
      });
    };
  }, []);

  async function handleCancelOrder() {
    if (!order) return;

    setActionLoading(true);

    try {
      const response = await orderService.cancel(order.id);
      setOrder(response);
      showSuccess("Pedido cancelado com sucesso.");
    } catch (error) {
      showError(error, "Erro ao cancelar pedido");
    } finally {
      setActionLoading(false);
    }
  }

  const reviewedProductIds = useMemo(() => {
    if (!order) return new Set<number>();

    return new Set(
      myReviews
        .filter((review) => review.active && review.orderId === order.id)
        .map((review) => review.productId),
    );
  }, [myReviews, order]);

  const productReviewMap = useMemo(() => {
    const reviewsByProductId = new Map<number, ReviewResponse>();

    if (!order) return reviewsByProductId;

    myReviews
      .filter((review) => review.active && review.orderId === order.id)
      .forEach((review) => {
        reviewsByProductId.set(review.productId, review);
      });

    return reviewsByProductId;
  }, [myReviews, order]);

  const reviewableItems = useMemo(() => {
    if (!order) return [];

    return order.items.filter((item, index, items) => {
      return (
        items.findIndex((current) => current.productId === item.productId) ===
        index
      );
    });
  }, [order]);

  function updateReviewForm(
    productId: number,
    patch: Partial<ReviewFormState>,
  ) {
    setReviewForms((current) => ({
      ...current,
      [productId]: {
        rating: current[productId]?.rating ?? 0,
        comment: current[productId]?.comment ?? "",
        images: current[productId]?.images ?? [],
        previewUrls: current[productId]?.previewUrls ?? [],
        loading: current[productId]?.loading ?? false,
        ...patch,
      },
    }));
  }

  function handleReviewImagesChange(
    productId: number,
    event: ChangeEvent<HTMLInputElement>,
  ) {
    const selectedFiles = Array.from(event.target.files ?? []);

    event.target.value = "";

    if (selectedFiles.length === 0) return;

    const currentForm = reviewForms[productId] ?? {
      rating: 0,
      comment: "",
      images: [],
      previewUrls: [],
      loading: false,
    };

    const currentImages = currentForm.images ?? [];
    const remainingSlots = MAX_REVIEW_IMAGES - currentImages.length;

    if (remainingSlots <= 0) {
      setReviewSuccess("");
      setReviewError(
        `É permitido anexar no máximo ${MAX_REVIEW_IMAGES} fotos por avaliação.`,
      );
      return;
    }

    const invalidTypeFile = selectedFiles.find(
      (file) => !file.type.toLowerCase().startsWith("image/"),
    );

    if (invalidTypeFile) {
      setReviewSuccess("");
      setReviewError(
        `O arquivo "${invalidTypeFile.name}" não é uma imagem válida.`,
      );
      return;
    }

    const oversizedFile = selectedFiles.find(
      (file) => file.size > MAX_REVIEW_IMAGE_SIZE_BYTES,
    );

    if (oversizedFile) {
      const sizeInMb = (oversizedFile.size / 1000 / 1000)
        .toFixed(2)
        .replace(".", ",");

      setReviewSuccess("");
      setReviewError(
        `A imagem "${oversizedFile.name}" tem ${sizeInMb}MB e excede o limite de ${MAX_REVIEW_IMAGE_SIZE_MB}MB. Escolha uma imagem menor.`,
      );
      return;
    }

    const nextFiles = selectedFiles.slice(0, remainingSlots);

    if (selectedFiles.length > remainingSlots) {
      setReviewSuccess("");
      setReviewError(
        `Algumas imagens não foram adicionadas porque o limite é de ${MAX_REVIEW_IMAGES} fotos.`,
      );
    } else {
      setReviewError("");
      setReviewSuccess("");
    }

    const nextPreviewUrls = nextFiles.map((file) => URL.createObjectURL(file));

    updateReviewForm(productId, {
      images: [...currentImages, ...nextFiles],
      previewUrls: [...currentForm.previewUrls, ...nextPreviewUrls],
    });
  }

  function removeReviewImage(productId: number, imageIndex: number) {
    const currentForm = reviewForms[productId];

    if (!currentForm) return;

    currentForm.previewUrls[imageIndex] &&
      URL.revokeObjectURL(currentForm.previewUrls[imageIndex]);

    const nextImages = currentForm.images.filter(
      (_, index) => index !== imageIndex,
    );

    const nextPreviewUrls = currentForm.previewUrls.filter(
      (_, index) => index !== imageIndex,
    );

    updateReviewForm(productId, {
      images: nextImages,
      previewUrls: nextPreviewUrls,
    });
  }

  async function handleSubmitReview(productId: number) {
    if (!order) return;

    const form = reviewForms[productId];

    if (!form?.rating || form.rating < 1 || form.rating > 5) {
      setReviewSuccess("");
      setReviewError("Selecione uma nota de 1 a 5 para avaliar o produto.");
      return;
    }

    setReviewError("");
    setReviewSuccess("");
    updateReviewForm(productId, { loading: true });

    try {
      await reviewService.create(order.id, productId, {
        rating: form.rating,
        comment: form.comment.trim(),
        images: form.images,
      });

      await loadMyReviews();
      setReviewError("");
      setReviewSuccess("Avaliação enviada com sucesso.");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Não foi possível enviar a avaliação.";

      setReviewSuccess("");
      setReviewError(message);
    } finally {
      updateReviewForm(productId, { loading: false });
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFAF9] px-4 py-12 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="h-52 animate-pulse rounded-[2.5rem] bg-stone-200/90" />
          <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_380px]">
            <div className="h-[520px] animate-pulse rounded-[2.5rem] bg-stone-200/90" />
            <div className="h-[520px] animate-pulse rounded-[2.5rem] bg-stone-200/90" />
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
            Não foi possível encontrar este pedido.
          </p>
          <Link
            href="/pedidos"
            className="mt-8 inline-flex rounded-full border border-[var(--pc-purple)] bg-[var(--pc-purple)] px-6 py-4 text-sm font-semibold text-white shadow-sm transition hover:bg-[var(--pc-purple-hover)]"
          >
            Voltar para pedidos
          </Link>
        </div>
      </div>
    );
  }

  const canPay = order.status === "CLOSED";
  const canCancel = order.status === "CLOSED";
  const canConfirmDelivery = order.status === "DELIVERED";

  return (
    <div className="min-h-screen bg-[#FAFAF9] px-4 py-10 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <Link
          href="/pedidos"
          className="inline-flex rounded-full border border-stone-200 bg-white px-4 py-3 text-sm font-semibold text-stone-700 transition hover:border-amber-500/45 hover:text-stone-900"
        >
          ← Voltar para pedidos
        </Link>

        <section className="mt-6 rounded-[2.5rem] border border-stone-200 bg-white p-6 shadow-sm md:p-8">
          <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-700">
                Detalhes do pedido
              </p>

              <div className="mt-3 flex flex-wrap items-center gap-3">
                <h1 className="text-4xl font-semibold tracking-tight text-stone-900 md:text-5xl">
                  Pedido #{order.id}
                </h1>

                <StatusBadge status={order.status} />
              </div>

              <p className="mt-4 max-w-2xl leading-7 text-stone-600">
                {ORDER_STATUS_DESCRIPTIONS[order.status]}
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              {canPay && (
                <Link
                  href={`/pagamento/${order.id}`}
                  className="rounded-2xl bg-[#8f6f2e] px-5 py-4 text-center text-sm font-semibold text-white transition hover:bg-[#76591f]"
                >
                  Pagar pedido
                </Link>
              )}

              {canConfirmDelivery && (
                <button
                  type="button"
                  onClick={handleConfirmDelivery}
                  disabled={actionLoading}
                  className="rounded-2xl bg-[var(--pc-purple)] px-5 py-4 text-sm font-semibold text-white transition hover:bg-[var(--pc-purple-hover)] disabled:cursor-not-allowed disabled:bg-stone-300"
                >
                  {actionLoading ? "Confirmando..." : "Confirmar recebimento"}
                </button>
              )}

              {canCancel && (
                <button
                  type="button"
                  onClick={handleCancelOrder}
                  disabled={actionLoading}
                  className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-semibold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Cancelar pedido
                </button>
              )}
            </div>
          </div>
        </section>

        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_400px]">
          <section className="space-y-4">
            <div className="rounded-[2.5rem] border border-stone-200 bg-white p-6 shadow-sm md:p-8">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
                    Produtos
                  </p>
                  <h2 className="mt-3 text-2xl font-semibold text-stone-900">
                    Itens do pedido
                  </h2>
                </div>

                <span className="rounded-2xl bg-[#F7F3EC] px-4 py-3 text-sm font-semibold text-stone-700">
                  {order.items.length}
                </span>
              </div>

              <div className="mt-6 space-y-4">
                {order.items.map((item) => {
                  const imageUrl = buildPublicFileUrl(item.productImageUrl);

                  return (
                    <article
                      key={item.id}
                      className="grid gap-4 rounded-[2rem] border border-stone-200 p-4 md:grid-cols-[120px_1fr_auto] md:items-center"
                    >
                      <Link
                        href={`/produtos/${item.productId}`}
                        className="flex h-32 items-center justify-center overflow-hidden rounded-[1.5rem] bg-[#F7F3EC]"
                      >
                        {imageUrl ? (
                          <img
                            src={imageUrl}
                            alt={item.productName}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <Laptop
                            className="h-10 w-10 text-stone-400"
                            aria-hidden="true"
                          />
                        )}
                      </Link>

                      <div className="min-w-0">
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-700">
                          {item.productBrand} • {item.productCategory}
                        </p>

                        <Link href={`/produtos/${item.productId}`}>
                          <h3 className="mt-2 text-xl font-semibold text-stone-900 transition hover:text-amber-700">
                            {item.productName}
                          </h3>
                        </Link>

                        <p className="mt-3 text-sm font-bold text-stone-500">
                          {item.quantity}x de{" "}
                          <span className="text-stone-800">
                            {formatCurrency(item.unitPriceAtMoment)}
                          </span>
                        </p>
                      </div>

                      <div className="rounded-2xl bg-[#F7F3EC] px-5 py-4 text-right">
                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-400">
                          Subtotal
                        </p>
                        <p className="mt-1 text-lg font-semibold text-stone-900">
                          {formatCurrency(item.subtotal)}
                        </p>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>

            <Timeline order={order} />

            {order.status === "FINISHED" && (
              <section
                id="avaliacao"
                className="rounded-[2.5rem] border border-stone-200 bg-white p-6 shadow-sm md:p-8"
              >
                <div className="border-b border-stone-200 pb-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-700">
                    Avaliação
                  </p>

                  <h2 className="mt-3 text-2xl font-semibold text-stone-900">
                    Avalie os produtos do pedido
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-stone-500">
                    Sua avaliação ajuda outros clientes a escolherem melhor.
                  </p>
                </div>

                {reviewError && (
                  <p className="mt-5 rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                    {reviewError}
                  </p>
                )}

                {reviewSuccess && (
                  <p className="mt-5 rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
                    {reviewSuccess}
                  </p>
                )}

                <div className="mt-6 space-y-4">
                  {reviewableItems.map((item) => {
                    const alreadyReviewed = reviewedProductIds.has(
                      item.productId,
                    );
                    const submittedReview = productReviewMap.get(item.productId);
                    const reviewProductImageUrl = buildPublicFileUrl(
                      item.productImageUrl,
                    );
                    const form = reviewForms[item.productId] ?? {
                      rating: 0,
                      comment: "",
                      images: [],
                      previewUrls: [],
                      loading: false,
                    };

                    return (
                      <article
                        key={item.productId}
                        className="rounded-[2rem] border border-stone-200 bg-[#F7F3EC] p-5"
                      >
                        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
                          <div className="flex min-w-0 items-start gap-3">
                            <div className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl border border-stone-200">
                              {reviewProductImageUrl ? (
                                <img
                                  src={reviewProductImageUrl}
                                  alt={item.productName}
                                  className="h-full w-full object-contain"
                                />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center text-stone-400">
                                  <Laptop
                                    className="h-7 w-7"
                                    aria-hidden="true"
                                  />
                                </div>
                              )}
                            </div>

                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-stone-900">
                                {item.productName}
                              </p>

                              <p className="mt-1 text-sm text-stone-500">
                                {item.productBrand} · {item.productCategory}
                              </p>
                            </div>
                          </div>

                          {alreadyReviewed && (
                            <span className="w-fit rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                              Avaliação enviada
                            </span>
                          )}
                        </div>

                        {alreadyReviewed && submittedReview && (
                          <SubmittedReviewCard
                            review={submittedReview}
                            onImageClick={setSelectedReviewImage}
                          />
                        )}

                        {!alreadyReviewed && (
                          <div className="mt-5 space-y-4">
                            <div>
                              <p className="text-sm font-semibold text-stone-900">
                                Nota
                              </p>

                              <div className="mt-2 flex flex-wrap gap-2">
                                {[1, 2, 3, 4, 5].map((rating) => (
                                  <button
                                    key={rating}
                                    type="button"
                                    onClick={() => {
                                      setReviewError("");
                                      setReviewSuccess("");
                                      updateReviewForm(item.productId, {
                                        rating,
                                      });
                                    }}
                                    className="rounded-full p-1 transition hover:scale-105"
                                    aria-label={`${rating} estrela${
                                      rating > 1 ? "s" : ""
                                    }`}
                                  >
                                    <Star
                                      className={`h-7 w-7 ${
                                        form.rating >= rating
                                          ? "fill-[#c89b3c] text-[#c89b3c]"
                                          : "text-stone-300"
                                      }`}
                                      aria-hidden="true"
                                    />
                                  </button>
                                ))}
                              </div>
                            </div>

                            <label className="block">
                              <span className="text-sm font-semibold text-stone-900">
                                Comentário opcional
                              </span>

                              <textarea
                                value={form.comment}
                                onChange={(event) => {
                                  setReviewError("");
                                  setReviewSuccess("");
                                  updateReviewForm(item.productId, {
                                    comment: event.target.value,
                                  });
                                }}
                                rows={4}
                                placeholder="Conte como foi sua experiência com o produto."
                                className="mt-2 w-full resize-none rounded-[1.5rem] border border-stone-200 bg-white px-4 py-3 text-sm leading-6 text-stone-900 outline-none transition placeholder:text-stone-400 hover:border-stone-300 focus:border-amber-500/45"
                              />
                            </label>

                            <div>
                              <div className="flex flex-col gap-2 rounded-[1.5rem] border border-stone-200 bg-white p-4">
                                <div>
                                  <p className="text-sm font-semibold text-stone-900">
                                    Fotos do produto
                                  </p>
                                  <p className="mt-1 text-xs leading-5 text-stone-500">
                                    Anexe até 5 fotos reais do produto recebido.
                                  </p>
                                </div>

                                <input
                                  type="file"
                                  accept="image/*"
                                  multiple
                                  onChange={(event) =>
                                    handleReviewImagesChange(
                                      item.productId,
                                      event,
                                    )
                                  }
                                  className="block w-full text-sm text-stone-600 file:mr-4 file:rounded-full file:border-0 file:bg-[#8f6f2e] file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white"
                                />
                              </div>

                              {form.previewUrls.length > 0 && (
                                <div className="mt-3 flex flex-wrap gap-3">
                                  {form.previewUrls.map((url, index) => (
                                    <div
                                      key={url}
                                      className="relative h-20 w-20 overflow-hidden rounded-2xl border border-stone-200 bg-white"
                                    >
                                      <img
                                        src={url}
                                        alt={`Preview ${index + 1}`}
                                        className="h-full w-full object-cover"
                                      />

                                      <button
                                        type="button"
                                        onClick={() =>
                                          removeReviewImage(
                                            item.productId,
                                            index,
                                          )
                                        }
                                        className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-stone-950/75 text-white"
                                        aria-label="Remover foto"
                                      >
                                        <X
                                          className="h-3.5 w-3.5"
                                          aria-hidden="true"
                                        />
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>

                            <div className="flex justify-end">
                              <button
                                type="button"
                                disabled={form.loading}
                                onClick={() =>
                                  handleSubmitReview(item.productId)
                                }
                                className="rounded-full bg-[#8f6f2e] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#76591f] disabled:cursor-not-allowed disabled:bg-stone-300"
                              >
                                {form.loading
                                  ? "Enviando..."
                                  : "Enviar avaliação"}
                              </button>
                            </div>
                          </div>
                        )}
                      </article>
                    );
                  })}
                </div>
              </section>
            )}
          </section>

          <aside className="h-fit space-y-6">
            <section className="rounded-[2.5rem] border border-stone-200 bg-white p-6 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-700">
                Resumo
              </p>

              <h2 className="mt-3 text-2xl font-semibold text-stone-900">
                {formatCurrency(order.totalAmount)}
              </h2>

              <div className="mt-6 space-y-3 rounded-[2rem] bg-[#F7F3EC] p-5">
                <SummaryRow
                  label="Itens"
                  value={formatCurrency(order.itemsAmount)}
                />
                <SummaryRow
                  label="Desconto"
                  value={`-${formatCurrency(order.discountAmount)}`}
                />
                <SummaryRow
                  label="Frete"
                  value={formatCurrency(order.freightAmount)}
                />

                <div className="border-t border-stone-200 pt-4">
                  <SummaryRow
                    label="Total"
                    value={formatCurrency(order.totalAmount)}
                    strong
                  />
                </div>
              </div>

              {order.couponCode && (
                <div className="mt-5 rounded-2xl bg-amber-50 p-4">
                  <p className="text-sm font-semibold text-amber-800">
                    Cupom aplicado
                  </p>
                  <p className="mt-1 text-sm text-amber-700">
                    {order.couponCode}
                  </p>
                </div>
              )}
            </section>

            <section className="rounded-[2.5rem] border border-stone-200 bg-white p-6 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
                Entrega
              </p>

              <h2 className="mt-3 text-xl font-semibold text-stone-900">
                Endereço congelado
              </h2>

              <p className="mt-4 rounded-2xl bg-[#F7F3EC] p-4 text-sm font-bold leading-7 text-stone-600">
                {order.deliveryAddress ?? "Endereço ainda não definido."}
              </p>

              {order.notes && (
                <div className="mt-4 rounded-2xl border border-stone-200 p-4">
                  <p className="text-sm font-semibold text-stone-900">
                    Observações
                  </p>
                  <p className="mt-2 text-sm leading-6 text-stone-600">
                    {order.notes}
                  </p>
                </div>
              )}
            </section>
          </aside>
        </div>

        {selectedReviewImage && (
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-stone-950/55 px-4 py-8 backdrop-blur-sm"
            onClick={() => setSelectedReviewImage(null)}
          >
            <div
              className="relative flex max-h-[90vh] w-full max-w-5xl items-center justify-center"
              onClick={(event) => event.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => setSelectedReviewImage(null)}
                className="absolute right-3 top-3 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-stone-950 shadow-[0_10px_30px_rgba(28,25,23,0.18)] transition hover:bg-white"
                aria-label="Fechar imagem"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>

              <img
                src={buildPublicFileUrl(selectedReviewImage) ?? selectedReviewImage}
                alt="Foto enviada na avaliação"
                className="max-h-[86vh] max-w-full rounded-[1.5rem] object-contain shadow-[0_24px_70px_rgba(28,25,23,0.28)]"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function SubmittedReviewCard({
  review,
  onImageClick,
}: {
  review: ReviewResponse;
  onImageClick: (imageUrl: string) => void;
}) {
  const avatarUrl = buildPublicFileUrl(review.userAvatarUrl);

  return (
    <div className="mt-5 rounded-[1.5rem] border border-stone-200 bg-white p-5">
      <div className="flex items-start gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#f4ead0] text-sm font-bold uppercase text-[#8f6f2e]">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={review.userFullName}
              className="h-full w-full object-cover"
            />
          ) : (
            getInitial(review.userFullName)
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="font-semibold text-stone-950">
                {review.userFullName}
              </p>

              <div className="mt-1 flex flex-wrap items-center gap-3">
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`h-4 w-4 ${
                        review.rating >= star
                          ? "fill-[#c89b3c] text-[#c89b3c]"
                          : "text-stone-300"
                      }`}
                      aria-hidden="true"
                    />
                  ))}
                </div>

                <p className="text-xs font-medium text-stone-500">
                  {formatDateTime(review.createdAt)}
                </p>
              </div>
            </div>
          </div>

          {review.comment && (
            <p className="mt-4 leading-7 text-stone-600">
              {review.comment}
            </p>
          )}

          {(review.images ?? []).length > 0 && (
            <div className="mt-4 flex flex-wrap gap-3">
              {(review.images ?? []).slice(0, 5).map((image) => {
                const imageUrl = buildPublicFileUrl(image.imageUrl) ?? image.imageUrl;

                return (
                  <button
                    key={image.id}
                    type="button"
                    onClick={() => onImageClick(imageUrl)}
                    className="h-20 w-20 overflow-hidden rounded-xl border border-stone-200 bg-[#fbfaf7] transition hover:border-[#d8c28f] hover:opacity-90"
                    aria-label="Ampliar foto enviada pelo cliente"
                  >
                    <img
                      src={imageUrl}
                      alt="Foto enviada pelo cliente"
                      className="h-full w-full object-cover"
                    />
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function getInitial(name: string) {
  return name.trim().charAt(0).toUpperCase() || "?";
}

function Timeline({ order }: { order: OrderResponse }) {
  const steps = [
    {
      label: "Criado",
      date: order.createdAt,
      active: Boolean(order.createdAt),
    },
    {
      label: "Fechado",
      date: order.closedAt,
      active: Boolean(order.closedAt),
    },
    {
      label: "Pago",
      date: order.paidAt,
      active: Boolean(order.paidAt),
    },
    {
      label: "Enviado",
      date: order.shippedAt,
      active: Boolean(order.shippedAt),
    },
    {
      label: "Entregue",
      date: order.deliveredAt,
      active: Boolean(order.deliveredAt),
    },
    {
      label: "Finalizado",
      date: order.finishedAt,
      active: Boolean(order.finishedAt),
    },
  ];

  return (
    <section className="rounded-[2.5rem] border border-stone-200 bg-white p-6 shadow-sm md:p-8">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-700">
        Linha do tempo
      </p>

      <h2 className="mt-3 text-2xl font-semibold text-stone-900">
        Status do pedido
      </h2>

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {steps.map((step) => (
          <div
            key={step.label}
            className={`rounded-2xl border p-5 ${
              step.active
                ? "border-emerald-200 bg-emerald-50"
                : "border-stone-200 bg-[#F7F3EC]"
            }`}
          >
            <p
              className={`font-semibold ${
                step.active ? "text-emerald-800" : "text-stone-500"
              }`}
            >
              {step.label}
            </p>
            <p className="mt-2 text-sm font-bold text-stone-500">
              {formatDateTime(step.date)}
            </p>
          </div>
        ))}
      </div>

      {order.cancelledAt && (
        <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-5">
          <p className="font-semibold text-red-800">Pedido cancelado</p>
          <p className="mt-2 text-sm text-red-700">
            Cancelado em {formatDateTime(order.cancelledAt)}
          </p>
        </div>
      )}
    </section>
  );
}

function StatusBadge({ status }: { status: OrderStatus }) {
  const styles: Record<OrderStatus, string> = {
    PENDING: "bg-stone-100 text-stone-700",
    CLOSED: "bg-amber-100 text-amber-700",
    PAID: "bg-emerald-100 text-emerald-700",
    SHIPPED: "bg-amber-100 text-amber-700",
    DELIVERED: "bg-sky-100 text-sky-700",
    FINISHED: "border border-stone-300 bg-stone-100 text-stone-800",
    CANCELLED: "bg-red-100 text-red-700",
  };

  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] ${styles[status]}`}
    >
      {ORDER_STATUS_LABELS[status]}
    </span>
  );
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
          strong
            ? "text-xl font-semibold text-stone-900"
            : "text-sm font-semibold text-stone-800"
        }`}
      >
        {value}
      </span>
    </div>
  );
}
