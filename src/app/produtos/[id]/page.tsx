"use client";

import { useEffect, useMemo, useState, type MouseEvent } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Heart,
  Laptop,
  Loader2,
  MapPin,
  Minus,
  PackageSearch,
  Plus,
  ShoppingCart,
  Star,
  Truck,
  X,
} from "lucide-react";
import type { ProductResponse } from "@/types/product";
import type { ReviewResponse, ReviewSummaryResponse } from "@/types/review";
import { productService } from "@/services/productService";
import { reviewService } from "@/services/reviewService";
import { favoriteService } from "@/services/favoriteService";
import { addressService } from "@/services/addressService";
import { buildPublicFileUrl } from "@/services/api";
import { ProductCard } from "@/components/products/ProductCard";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { useFeedbackModal } from "@/contexts/FeedbackModalContext";
import { formatCurrency, formatDate } from "@/utils/formatters";
import {
  formatCepInput,
  getStoredShippingCep,
  sanitizeCep,
  saveStoredShippingCep,
} from "@/utils/shippingCepStorage";

type ShippingQuoteResponse = Awaited<
  ReturnType<typeof addressService.quoteByCep>
>;

type NormalizedShippingQuote = {
  cep: string;
  price: number;
  deliveryDays: number | null;
  serviceName: string;
  city?: string;
  state?: string;
};

export default function ProductDetailsPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const productId = Number.parseInt(String(params.id), 10);

  const { isAuthenticated, profile } = useAuth();
  const cartContext = useCart();
  const { addToCart, actionLoading } = cartContext;
  const { showError, showInfo } = useFeedbackModal();

  const [product, setProduct] = useState<ProductResponse | null>(null);
  const [related, setRelated] = useState<ProductResponse[]>([]);
  const [reviews, setReviews] = useState<ReviewResponse[]>([]);
  const [allReviewsForSummary, setAllReviewsForSummary] = useState<
    ReviewResponse[]
  >([]);
  const [reviewSummary, setReviewSummary] =
    useState<ReviewSummaryResponse | null>(null);
  const [reviewRatingFilter, setReviewRatingFilter] = useState<number | null>(
    null,
  );
  const [reviewsWithCommentOnly, setReviewsWithCommentOnly] = useState(false);
  const [reviewsWithMediaOnly, setReviewsWithMediaOnly] = useState(false);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [selectedReviewImage, setSelectedReviewImage] = useState<string | null>(
    null,
  );
  const [quantity, setQuantity] = useState(1);
  const [favorited, setFavorited] = useState(false);
  const [loading, setLoading] = useState(true);
  const [favoriteLoading, setFavoriteLoading] = useState(false);

  const [zoomActive, setZoomActive] = useState(false);
  const [zoomOrigin, setZoomOrigin] = useState("50% 50%");

  const [shippingCep, setShippingCep] = useState("");
  const [shippingError, setShippingError] = useState<string | null>(null);
  const [shippingLoading, setShippingLoading] = useState(false);
  const [shippingQuote, setShippingQuote] =
    useState<NormalizedShippingQuote | null>(null);

  const imageUrl = product ? (buildPublicFileUrl(product.imageUrl) ?? "") : "";

  const unavailable =
    !product ||
    product.outOfStock ||
    product.availableQuantity <= 0 ||
    !product.active;

  const maxQuantity = useMemo(() => {
    return product?.availableQuantity && product.availableQuantity > 0
      ? product.availableQuantity
      : 1;
  }, [product]);

  const stockLabel = useMemo(() => {
    if (!product || unavailable) return "Indisponível";
    if (product.lowStock) return "Últimas unidades";
    return "Disponível";
  }, [product, unavailable]);

  const descriptionParagraphs = useMemo(() => {
    return buildDescriptionParagraphs(product?.description);
  }, [product?.description]);

  const computedReviewSummary = useMemo(() => {
    const totalReviews = allReviewsForSummary.length;
    const averageRating = totalReviews
      ? allReviewsForSummary.reduce(
          (total, review) => total + review.rating,
          0,
        ) / totalReviews
      : 0;

    return {
      averageRating,
      totalReviews,
      fiveStars: allReviewsForSummary.filter((review) => review.rating === 5)
        .length,
      fourStars: allReviewsForSummary.filter((review) => review.rating === 4)
        .length,
      threeStars: allReviewsForSummary.filter((review) => review.rating === 3)
        .length,
      twoStars: allReviewsForSummary.filter((review) => review.rating === 2)
        .length,
      oneStar: allReviewsForSummary.filter((review) => review.rating === 1)
        .length,
      withComments: allReviewsForSummary.filter((review) =>
        review.comment?.trim(),
      ).length,
      withMedia: allReviewsForSummary.filter(
        (review) => review.images?.length > 0,
      ).length,
    };
  }, [allReviewsForSummary]);

  const displayReviewSummary =
    reviewSummary && reviewSummary.totalReviews > 0
      ? reviewSummary
      : computedReviewSummary;

  async function loadProduct() {
    if (!Number.isFinite(productId)) return;

    setLoading(true);

    try {
      const [
        productResponse,
        reviewSummaryResponse,
        allReviewsResponse,
        relatedResponse,
      ] = await Promise.all([
        productService.findById(productId),
        reviewService.getSummaryByProductId(productId).catch(() => null),
        reviewService.findByProductId(productId).catch(() => []),
        productService.findRelated(productId).catch(() => []),
      ]);

      setProduct(productResponse);
      setReviewSummary(reviewSummaryResponse);
      setAllReviewsForSummary(allReviewsResponse);
      setRelated(relatedResponse);
      setQuantity(1);
      setShippingQuote(null);
      setShippingError(null);
    } catch (error) {
      showError(error, "Erro ao carregar produto");
    } finally {
      setLoading(false);
    }
  }

  async function loadReviews() {
    if (!Number.isFinite(productId)) return;

    setReviewsLoading(true);

    try {
      const response = await reviewService.findByProductId(productId, {
        rating: reviewRatingFilter,
        withComment: reviewsWithCommentOnly,
        withMedia: reviewsWithMediaOnly,
      });

      setReviews(response);
    } catch (error) {
      showError(error, "Erro ao carregar avaliações");
    } finally {
      setReviewsLoading(false);
    }
  }

  async function loadFavoriteStatus() {
    if (!isAuthenticated || !Number.isFinite(productId)) {
      setFavorited(false);
      return;
    }

    try {
      const exists = await favoriteService.existsForCurrentUser(productId);
      setFavorited(exists);
    } catch {
      setFavorited(false);
    }
  }

  useEffect(() => {
    loadProduct();
  }, [productId]);

  useEffect(() => {
    loadReviews();
  }, [
    productId,
    reviewRatingFilter,
    reviewsWithCommentOnly,
    reviewsWithMediaOnly,
  ]);

  useEffect(() => {
    loadFavoriteStatus();
  }, [isAuthenticated, productId]);

  useEffect(() => {
    setShippingQuote(null);
    setShippingError(null);
  }, [quantity]);

  useEffect(() => {
    const profileCep = sanitizeCep(profile?.address?.cep);

    if (profileCep.length === 8) {
      setShippingCep(formatCepInput(profileCep));
      return;
    }

    const sessionCep = getStoredShippingCep();

    if (sessionCep.length === 8) {
      setShippingCep(formatCepInput(sessionCep));
    }
  }, [profile?.address?.cep]);

  async function handleAddToCart() {
    if (!product) return;

    if (!isAuthenticated) {
      redirectToLoginAfterBlockedAction(
        router,
        "Só é possível adicionar produtos ao carrinho depois de fazer login.",
        "Login necessário",
      );
      return;
    }

    if (unavailable) {
      showInfo("Este produto não está disponível para compra no momento.");
      return;
    }

    try {
      await addToCart(product, quantity);
    } catch (error) {
      showError(error, "Erro ao adicionar produto");
    }
  }

  async function handleToggleFavorite() {
    if (!product) return;

    if (!isAuthenticated) {
      redirectToLoginAfterBlockedAction(
        router,
        "Só é possível adicionar produtos aos favoritos depois de fazer login.",
        "Login necessário",
      );
      return;
    }

    setFavoriteLoading(true);

    try {
      if (favorited) {
        await favoriteService.removeFavorite(product.id);
        setFavorited(false);
      } else {
        await favoriteService.addFavorite(product.id);
        setFavorited(true);
      }
    } catch (error) {
      showError(error, "Erro ao atualizar favorito");
    } finally {
      setFavoriteLoading(false);
    }
  }

  function handleImageMouseMove(event: MouseEvent<HTMLDivElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;

    setZoomOrigin(`${x}% ${y}%`);
  }

  function handleImageMouseLeave() {
    setZoomActive(false);
    setZoomOrigin("50% 50%");
  }

  async function handleCalculateShipping() {
    const sanitizedCep = sanitizeCep(shippingCep);

    if (!product) return;

    if (sanitizedCep.length !== 8) {
      setShippingError("Digite um CEP válido com 8 números.");
      setShippingQuote(null);
      return;
    }

    setShippingLoading(true);
    setShippingError(null);
    setShippingQuote(null);

    try {
      const response = await addressService.quoteByCep(sanitizedCep);

      setShippingQuote(normalizeShippingQuote(response, sanitizedCep));
      saveStoredShippingCep(sanitizedCep);
    } catch (error) {
      setShippingError(
        error instanceof Error
          ? error.message
          : "Não foi possível calcular o frete.",
      );
    } finally {
      setShippingLoading(false);
    }
  }

  function handleReviewRatingFilter(rating: number | null) {
    setReviewRatingFilter(rating);
    setReviewsWithCommentOnly(false);
    setReviewsWithMediaOnly(false);
  }

  function toggleReviewsWithCommentOnly() {
    setReviewRatingFilter(null);
    setReviewsWithMediaOnly(false);
    setReviewsWithCommentOnly((current) => !current);
  }

  function toggleReviewsWithMediaOnly() {
    setReviewRatingFilter(null);
    setReviewsWithCommentOnly(false);
    setReviewsWithMediaOnly((current) => !current);
  }

  function clearReviewFilters() {
    setReviewRatingFilter(null);
    setReviewsWithCommentOnly(false);
    setReviewsWithMediaOnly(false);
  }

  if (loading) {
    return <ProductDetailsSkeleton />;
  }

  if (!product) {
    return <ProductNotFound />;
  }

  return (
    <main className="min-h-screen bg-[#f8f7f3]">
      <section className="px-4 py-7 lg:px-8 lg:py-9">
        <div className="mx-auto max-w-7xl">
          <Link
            href="/produtos"
            className="inline-flex items-center gap-2 text-sm font-semibold text-stone-600 transition hover:text-stone-950"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Voltar para o catálogo
          </Link>

          <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_420px] xl:grid-cols-[minmax(0,1fr)_440px]">
            <section className="overflow-hidden rounded-[2rem] border border-stone-200 bg-white lg:self-start">
              <div
                className="relative aspect-[5/4] overflow-hidden bg-[#f1efea] p-8 md:p-12"
                onMouseMove={handleImageMouseMove}
                onMouseEnter={() => setZoomActive(true)}
                onMouseLeave={handleImageMouseLeave}
              >
                {(product.lowStock || product.outOfStock) && (
                  <span
                    className={`absolute left-6 top-6 z-10 rounded-full bg-white/95 px-4 py-2 text-xs font-bold shadow-sm backdrop-blur ${
                      product.outOfStock
                        ? "text-[var(--pc-danger)]"
                        : "text-[#8f6f2e]"
                    }`}
                  >
                    {product.outOfStock ? "Indisponível" : "Últimas unidades"}
                  </span>
                )}

                {imageUrl ? (
                  <>
                    <img
                      src={imageUrl}
                      alt={product.name}
                      className={`relative z-[1] h-full w-full cursor-zoom-in object-contain transition-transform duration-150 ease-out ${
                        zoomActive ? "scale-[1.85]" : "scale-100"
                      }`}
                      style={{ transformOrigin: zoomOrigin }}
                    />

                    <span className="absolute bottom-5 left-5 z-10 hidden rounded-full bg-white/92 px-4 py-2 text-xs font-semibold text-stone-700 shadow-sm md:inline-flex">
                      Passe o mouse para ampliar
                    </span>
                  </>
                ) : (
                  <div className="flex h-full w-full items-center justify-center rounded-[2rem] bg-white text-stone-400">
                    <Laptop className="h-16 w-16" aria-hidden="true" />
                  </div>
                )}
              </div>

              <div className="border-t border-stone-200 bg-white p-6 md:p-7">
                <div className="flex flex-col justify-between gap-3 md:flex-row md:items-end">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#8f6f2e]">
                      Informações do produto
                    </p>
                    <h2 className="mt-2 text-2xl font-semibold tracking-[-0.035em] text-stone-950">
                      Detalhes principais
                    </h2>
                  </div>

                  <p className="max-w-md text-sm leading-6 text-stone-500">
                    Dados rápidos para comparar antes de continuar a compra.
                  </p>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  <ProductSpecCard label="Marca" value={product.brand} />
                  <ProductSpecCard
                    label="Categoria"
                    value={`${product.categoryGroup} · ${product.category}`}
                  />
                  {product.model && (
                    <ProductSpecCard label="Modelo" value={product.model} />
                  )}
                  <ProductSpecCard label="Disponibilidade" value={stockLabel} />
                </div>
              </div>
            </section>

            <aside className="lg:sticky lg:top-24 lg:self-start">
              <section className="rounded-[2rem] border border-stone-200 bg-white p-6 shadow-[0_20px_54px_rgba(41,37,36,0.06)] md:p-7">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#8f6f2e]">
                      {product.brand}
                    </p>

                    <h1 className="mt-3 text-3xl font-semibold leading-[1.08] tracking-[-0.045em] text-stone-950 md:text-4xl">
                      {product.name}
                    </h1>

                    <p className="mt-3 text-sm font-medium text-stone-500">
                      {product.categoryGroup} · {product.category}
                      {product.model ? ` · ${product.model}` : ""}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleToggleFavorite}
                    disabled={favoriteLoading}
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full border transition disabled:cursor-not-allowed disabled:opacity-60 ${
                      favorited
                        ? "border-[#d8c28f] bg-[#f4ead0] text-[#8f6f2e]"
                        : "border-stone-200 bg-white text-stone-500 hover:border-[#d8c28f] hover:text-[#8f6f2e]"
                    }`}
                    aria-label={
                      favorited
                        ? "Remover dos favoritos"
                        : "Adicionar aos favoritos"
                    }
                  >
                    {favoriteLoading ? (
                      <Loader2
                        className="h-4 w-4 animate-spin"
                        aria-hidden="true"
                      />
                    ) : (
                      <Heart
                        className="h-4 w-4"
                        fill={favorited ? "currentColor" : "none"}
                        aria-hidden="true"
                      />
                    )}
                  </button>
                </div>

                <div className="mt-7 border-y border-stone-200 py-6">
                  <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-stone-500">
                    Preço
                  </p>

                  <p className="mt-2 text-4xl font-semibold tracking-[-0.045em] text-stone-950">
                    {formatCurrency(product.price)}
                  </p>

                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    <ProductInfoPill
                      label="Status"
                      value={stockLabel}
                      tone={
                        unavailable
                          ? "danger"
                          : product.lowStock
                            ? "warning"
                            : "success"
                      }
                    />

                    <ProductInfoPill
                      label="Avaliação"
                      value={
                        product.reviewCount > 0
                          ? `${product.averageRating.toFixed(1)} (${product.reviewCount})`
                          : "Sem avaliações"
                      }
                      showStar={product.reviewCount > 0}
                    />
                  </div>
                </div>

                <div className="mt-6">
                  <p className="text-sm font-semibold text-stone-950">
                    Quantidade
                  </p>

                  <div className="mt-3 flex flex-col gap-3 sm:flex-row">
                    <div className="flex w-fit items-center rounded-full border border-stone-200 bg-white">
                      <button
                        type="button"
                        onClick={() =>
                          setQuantity((current) => Math.max(1, current - 1))
                        }
                        className="flex h-12 w-12 items-center justify-center text-stone-700 transition hover:text-stone-950"
                        aria-label="Diminuir quantidade"
                      >
                        <Minus className="h-4 w-4" aria-hidden="true" />
                      </button>

                      <input
                        type="number"
                        min={1}
                        max={maxQuantity}
                        value={quantity}
                        onChange={(event) => {
                          const value = Number(event.target.value);
                          setQuantity(
                            Math.min(Math.max(value || 1, 1), maxQuantity),
                          );
                        }}
                        className="h-12 w-16 border-x border-stone-200 bg-white text-center text-sm font-semibold text-stone-950 outline-none"
                        aria-label="Quantidade"
                      />

                      <button
                        type="button"
                        onClick={() =>
                          setQuantity((current) =>
                            Math.min(maxQuantity, current + 1),
                          )
                        }
                        className="flex h-12 w-12 items-center justify-center text-stone-700 transition hover:text-stone-950"
                        aria-label="Aumentar quantidade"
                      >
                        <Plus className="h-4 w-4" aria-hidden="true" />
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={handleAddToCart}
                      disabled={unavailable || actionLoading}
                      className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-full bg-[#8f6f2e] px-5 text-sm font-semibold text-white transition hover:bg-[#76591f] disabled:cursor-not-allowed disabled:bg-stone-300"
                    >
                      {unavailable ? (
                        "Produto indisponível"
                      ) : actionLoading ? (
                        <>
                          <Loader2
                            className="h-4 w-4 animate-spin"
                            aria-hidden="true"
                          />
                          Adicionando
                        </>
                      ) : (
                        <>
                          <ShoppingCart
                            className="h-4 w-4"
                            aria-hidden="true"
                          />
                          Adicionar ao carrinho
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <section className="mt-6 rounded-[1.75rem] border border-stone-200 bg-[#fbfaf7] p-5">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-stone-200 bg-white text-[#8f6f2e]">
                      <MapPin className="h-4 w-4" aria-hidden="true" />
                    </div>

                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-stone-950">
                        Calcule o frete
                      </p>
                      <p className="mt-1 text-sm leading-6 text-stone-500">
                        Consulte valor e prazo para este CEP antes de comprar.
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={9}
                      value={shippingCep}
                      onChange={(event) => {
                        setShippingCep(formatCepInput(event.target.value));
                        setShippingError(null);
                        setShippingQuote(null);
                      }}
                      placeholder="Digite seu CEP"
                      className="h-12 flex-1 rounded-full border border-stone-200 bg-white px-4 text-sm text-stone-950 outline-none transition placeholder:text-stone-400 focus:border-[#d8c28f]"
                    />

                    <button
                      type="button"
                      onClick={handleCalculateShipping}
                      disabled={shippingLoading}
                      className="inline-flex h-12 items-center justify-center rounded-full border border-stone-200 bg-white px-5 text-sm font-semibold text-stone-950 transition hover:border-[#d8c28f] hover:bg-[#f6f1e6] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {shippingLoading ? (
                        <>
                          <Loader2
                            className="mr-2 h-4 w-4 animate-spin"
                            aria-hidden="true"
                          />
                          Calculando
                        </>
                      ) : (
                        "Calcular"
                      )}
                    </button>
                  </div>

                  <p className="mt-3 text-xs leading-5 text-stone-500">
                    Digite o CEP sem ponto. Exemplo: 13480-000.
                  </p>

                  {shippingError && (
                    <p className="mt-3 text-sm font-medium text-[var(--pc-danger)]">
                      {shippingError}
                    </p>
                  )}

                  {shippingQuote && (
                    <div className="mt-4 rounded-[1.35rem] border border-stone-200 bg-white p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex min-w-0 gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#f4ead0] text-[#8f6f2e]">
                            <Truck className="h-4 w-4" aria-hidden="true" />
                          </div>

                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-stone-950">
                              {shippingQuote.serviceName}
                            </p>

                            <p className="mt-1 text-xs leading-5 text-stone-500">
                              {shippingQuote.city && shippingQuote.state
                                ? `${shippingQuote.city}, ${shippingQuote.state}`
                                : `CEP ${formatCepInput(shippingQuote.cep)}`}
                            </p>
                          </div>
                        </div>

                        <div className="shrink-0 text-right">
                          <p className="text-sm font-semibold text-stone-950">
                            {formatCurrency(shippingQuote.price)}
                          </p>

                          <p className="mt-1 text-xs font-medium text-stone-500">
                            {formatShippingDeadline(shippingQuote.deliveryDays)}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </section>
              </section>
            </aside>
          </div>

          <section className="mt-7">
            <article className="rounded-[2rem] border border-stone-200 bg-white p-6 md:p-8 lg:p-10">
              <div className="border-b border-stone-200 pb-6">
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#8f6f2e]">
                  Descrição
                </p>

                <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-stone-950">
                  Sobre o produto
                </h2>
              </div>

              <div className="mt-7 max-w-4xl space-y-5 text-[1rem] leading-8 text-stone-700">
                {descriptionParagraphs.map((paragraph, index) => (
                  <p key={index}>{paragraph}</p>
                ))}
              </div>
            </article>
          </section>

          <section className="mt-7 rounded-[2rem] border border-stone-200 bg-white p-6 md:p-8 lg:p-10">
            <div className="flex flex-col justify-between gap-5 border-b border-stone-200 pb-6 lg:flex-row lg:items-start">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#8f6f2e]">
                  Avaliações
                </p>

                <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-stone-950">
                  Opiniões de clientes
                </h2>

                <p className="mt-2 text-sm leading-6 text-stone-500">
                  As avaliações aparecem aqui depois que pedidos finalizados
                  forem avaliados pelos clientes.
                </p>
              </div>

              <div className="rounded-2xl border border-stone-200 bg-[#fbfaf7] px-5 py-4 lg:min-w-[240px]">
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-stone-500">
                  Média geral
                </p>

                <div className="mt-2 flex items-end gap-2">
                  <p className="text-3xl font-semibold tracking-[-0.04em] text-stone-950">
                    {displayReviewSummary.averageRating.toFixed(1)}
                  </p>
                  <p className="pb-1 text-sm font-medium text-stone-500">
                    de 5
                  </p>
                </div>

                <p className="mt-2 text-sm text-stone-500">
                  {displayReviewSummary.totalReviews} avaliação(ões)
                </p>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-2">
              <ReviewFilterButton
                label={`Tudo (${displayReviewSummary.totalReviews})`}
                active={
                  reviewRatingFilter === null &&
                  !reviewsWithCommentOnly &&
                  !reviewsWithMediaOnly
                }
                onClick={clearReviewFilters}
              />
              <ReviewFilterButton
                label={`5 estrelas (${displayReviewSummary.fiveStars})`}
                active={reviewRatingFilter === 5}
                onClick={() => handleReviewRatingFilter(5)}
              />
              <ReviewFilterButton
                label={`4 estrelas (${displayReviewSummary.fourStars})`}
                active={reviewRatingFilter === 4}
                onClick={() => handleReviewRatingFilter(4)}
              />
              <ReviewFilterButton
                label={`3 estrelas (${displayReviewSummary.threeStars})`}
                active={reviewRatingFilter === 3}
                onClick={() => handleReviewRatingFilter(3)}
              />
              <ReviewFilterButton
                label={`2 estrelas (${displayReviewSummary.twoStars})`}
                active={reviewRatingFilter === 2}
                onClick={() => handleReviewRatingFilter(2)}
              />
              <ReviewFilterButton
                label={`1 estrela (${displayReviewSummary.oneStar})`}
                active={reviewRatingFilter === 1}
                onClick={() => handleReviewRatingFilter(1)}
              />
              <ReviewFilterButton
                label={`Com comentários (${displayReviewSummary.withComments})`}
                active={reviewsWithCommentOnly}
                onClick={toggleReviewsWithCommentOnly}
              />
              <ReviewFilterButton
                label={`Com mídia (${displayReviewSummary.withMedia})`}
                active={reviewsWithMediaOnly}
                onClick={toggleReviewsWithMediaOnly}
              />
            </div>

            <div className="mt-7">
              {reviewsLoading ? (
                <div className="rounded-[1.5rem] border border-stone-200 bg-[#fbfaf7] p-6 text-sm leading-6 text-stone-500">
                  Carregando avaliações...
                </div>
              ) : reviews.length === 0 ? (
                <div className="rounded-[1.5rem] border border-stone-200 bg-[#fbfaf7] p-6 text-sm leading-6 text-stone-500">
                  Nenhuma avaliação encontrada para os filtros selecionados.
                </div>
              ) : (
                <div className="divide-y divide-stone-200">
                  {reviews.map((review) => (
                    <ReviewCard
                      key={review.id}
                      review={review}
                      onImageClick={setSelectedReviewImage}
                    />
                  ))}
                </div>
              )}
            </div>
          </section>

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
                  src={
                    buildPublicFileUrl(selectedReviewImage) ??
                    selectedReviewImage
                  }
                  alt="Foto enviada na avaliação"
                  className="max-h-[86vh] max-w-full rounded-[1.5rem] object-contain shadow-[0_24px_70px_rgba(28,25,23,0.28)]"
                />
              </div>
            </div>
          )}

          {related.length > 0 && (
            <section className="mt-12">
              <div className="flex flex-col justify-between gap-4 border-t border-stone-200 pt-10 md:flex-row md:items-end">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#8f6f2e]">
                    Relacionados
                  </p>

                  <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-stone-950">
                    Você também pode gostar
                  </h2>
                </div>

                <Link
                  href={`/produtos?categoryGroup=${encodeURIComponent(
                    product.categoryGroup,
                  )}`}
                  className="inline-flex items-center gap-2 text-sm font-bold text-stone-950 transition hover:text-[#8f6f2e]"
                >
                  Ver catálogo
                </Link>
              </div>

              <div className="mt-7 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
                {related.slice(0, 4).map((relatedProduct) => (
                  <ProductCard
                    key={relatedProduct.id}
                    product={relatedProduct}
                    compact
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      </section>
    </main>
  );
}

function ProductInfoPill({
  label,
  value,
  tone = "neutral",
  showStar = false,
}: {
  label: string;
  value: string;
  tone?: "neutral" | "success" | "warning" | "danger";
  showStar?: boolean;
}) {
  const toneClass = {
    neutral: "text-stone-950",
    success: "text-[var(--pc-green)]",
    warning: "text-[#8f6f2e]",
    danger: "text-[var(--pc-danger)]",
  }[tone];

  return (
    <div className="rounded-2xl border border-stone-200 bg-[#fbfaf7] p-4">
      <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-stone-500">
        {label}
      </p>

      <p
        className={`mt-1 flex items-center gap-1 text-sm font-semibold ${toneClass}`}
      >
        {showStar && (
          <Star
            className="h-3.5 w-3.5 text-[#c59b3d]"
            fill="currentColor"
            aria-hidden="true"
          />
        )}
        {value}
      </p>
    </div>
  );
}

function ProductSpecCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.25rem] border border-stone-200 bg-[#fbfaf7] p-4">
      <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-stone-500">
        {label}
      </p>

      <p className="mt-2 line-clamp-2 text-sm font-semibold text-stone-950">
        {value}
      </p>
    </div>
  );
}

function ReviewCard({
  review,
  onImageClick,
}: {
  review: ReviewResponse;
  onImageClick: (imageUrl: string) => void;
}) {
  const avatarUrl = buildPublicFileUrl(review.userAvatarUrl);

  return (
    <article className="py-6 first:pt-0 last:pb-0">
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#f4ead0] text-sm font-bold uppercase text-[#8f6f2e]">
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
                  {formatDate(review.createdAt)}
                </p>
              </div>
            </div>
          </div>

          {review.comment && (
            <p className="mt-4 leading-7 text-stone-600">{review.comment}</p>
          )}

          {review.images.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-3">
              {review.images.slice(0, 5).map((image) => {
                const imageUrl =
                  buildPublicFileUrl(image.imageUrl) ?? image.imageUrl;

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
    </article>
  );
}

function ReviewFilterButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
        active
          ? "border-[#8f6f2e] bg-[#f4ead0] text-[#8f6f2e]"
          : "border-stone-200 bg-white text-stone-600 hover:border-[#d8c28f] hover:text-stone-950"
      }`}
    >
      {label}
    </button>
  );
}

function getInitial(name: string) {
  return name.trim().charAt(0).toUpperCase() || "?";
}

function ProductNotFound() {
  return (
    <main className="min-h-screen bg-[#f8f7f3] px-4 py-16 lg:px-8">
      <div className="mx-auto max-w-xl rounded-[2rem] border border-stone-200 bg-white p-10 text-center shadow-sm">
        <PackageSearch
          className="mx-auto h-10 w-10 text-stone-400"
          aria-hidden="true"
        />

        <h1 className="mt-5 text-2xl font-semibold tracking-[-0.035em] text-stone-950">
          Produto não encontrado
        </h1>

        <p className="mt-3 text-stone-500">
          O produto pode ter sido removido ou está indisponível.
        </p>

        <Link
          href="/produtos"
          className="mt-6 inline-flex h-11 items-center justify-center rounded-full border border-stone-200 bg-white px-5 text-sm font-semibold text-stone-950 transition hover:border-[#d8c28f] hover:bg-[#fbfaf7]"
        >
          Voltar para produtos
        </Link>
      </div>
    </main>
  );
}

function ProductDetailsSkeleton() {
  return (
    <main className="min-h-screen bg-[#f8f7f3] px-4 py-9 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="h-5 w-40 animate-pulse rounded bg-stone-200" />

        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_420px] xl:grid-cols-[minmax(0,1fr)_440px]">
          <div className="overflow-hidden rounded-[2rem] border border-stone-200 bg-white">
            <div className="aspect-[5/4] animate-pulse bg-stone-200" />

            <div className="border-t border-stone-200 p-7">
              <div className="h-3 w-40 animate-pulse rounded bg-stone-200" />
              <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div
                    key={index}
                    className="h-24 animate-pulse rounded-[1.25rem] bg-stone-200"
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-[2rem] border border-stone-200 bg-white p-7">
            <div className="h-3 w-28 animate-pulse rounded bg-stone-200" />
            <div className="mt-5 h-10 w-full animate-pulse rounded bg-stone-200" />
            <div className="mt-3 h-5 w-2/3 animate-pulse rounded bg-stone-200" />
            <div className="mt-8 h-12 w-56 animate-pulse rounded bg-stone-200" />
            <div className="mt-8 h-12 w-full animate-pulse rounded-full bg-stone-200" />
            <div className="mt-6 h-44 animate-pulse rounded-[1.75rem] bg-stone-200" />
          </div>
        </div>

        <div className="mt-7 h-72 animate-pulse rounded-[2rem] bg-stone-200" />
      </div>
    </main>
  );
}

function buildDescriptionParagraphs(description: string | null | undefined) {
  const paragraphs = description
    ?.split(/\n+/)
    .map((item) => item.trim())
    .filter(Boolean);

  if (paragraphs && paragraphs.length > 0) {
    return paragraphs;
  }

  return [
    "Este produto ainda não possui uma descrição detalhada cadastrada. Confira as informações principais, disponibilidade e avaliações antes de continuar a compra.",
  ];
}

function formatShippingDeadline(days: number | null) {
  if (!days || !Number.isFinite(days)) {
    return "Prazo sob consulta";
  }

  return `${days} ${days === 1 ? "dia útil" : "dias úteis"}`;
}

function normalizeShippingQuote(
  response: ShippingQuoteResponse,
  fallbackCep: string,
): NormalizedShippingQuote {
  const data = toRecord(response);
  const shipping = getRecordCandidate(data, [
    "shipping",
    "freight",
    "quote",
    "delivery",
  ]);

  const sources = shipping ? [shipping, data] : [data];

  const price =
    getNumberField(sources, [
      "shippingPrice",
      "freightPrice",
      "freight",
      "price",
      "amount",
      "value",
      "total",
      "cost",
    ]) ?? 0;

  const deliveryDays =
    getNumberField(sources, [
      "deliveryDays",
      "deadlineDays",
      "estimatedDays",
      "estimatedDeliveryDays",
      "days",
      "deadline",
    ]) ?? null;

  const cep =
    getStringField(sources, ["cep", "zipCode", "destinationCep"]) ??
    fallbackCep;

  const city = getStringField(sources, ["city", "localidade"]);
  const state = getStringField(sources, ["state", "uf"]);
  const serviceName =
    getStringField(sources, ["serviceName", "service", "name", "type"]) ??
    "Entrega PointClick";

  return {
    cep,
    city,
    state,
    price,
    deliveryDays,
    serviceName,
  };
}

function toRecord(value: unknown): Record<string, unknown> {
  if (value && typeof value === "object") {
    return value as Record<string, unknown>;
  }

  return {};
}

function getRecordCandidate(
  source: Record<string, unknown>,
  keys: string[],
): Record<string, unknown> | null {
  for (const key of keys) {
    const value = source[key];

    if (value && typeof value === "object" && !Array.isArray(value)) {
      return value as Record<string, unknown>;
    }
  }

  return null;
}

function getNumberField(
  sources: Record<string, unknown>[],
  keys: string[],
): number | null {
  for (const source of sources) {
    for (const key of keys) {
      const value = source[key];

      if (typeof value === "number" && Number.isFinite(value)) {
        return value;
      }

      if (typeof value === "string") {
        const normalized = value.replace(/\./g, "").replace(",", ".");
        const parsed = Number(normalized);

        if (Number.isFinite(parsed)) {
          return parsed;
        }
      }
    }
  }

  return null;
}

function getStringField(
  sources: Record<string, unknown>[],
  keys: string[],
): string | undefined {
  for (const source of sources) {
    for (const key of keys) {
      const value = source[key];

      if (typeof value === "string" && value.trim()) {
        return value;
      }

      if (typeof value === "number" && Number.isFinite(value)) {
        return String(value);
      }
    }
  }

  return undefined;
}

const LOGIN_REDIRECT_PATH_KEY = "pointclick_login_redirect_path";
const LOGIN_REQUIRED_FEEDBACK_KEY = "pointclick_login_required_feedback";

function redirectToLoginAfterBlockedAction(
  router: ReturnType<typeof useRouter>,
  message: string,
  title: string,
) {
  if (typeof window !== "undefined") {
    const currentPath = `${window.location.pathname}${window.location.search}`;

    try {
      sessionStorage.setItem(LOGIN_REDIRECT_PATH_KEY, currentPath);
      sessionStorage.setItem(
        LOGIN_REQUIRED_FEEDBACK_KEY,
        JSON.stringify({
          title,
          message,
        }),
      );
    } catch {
      // Não bloqueia o redirecionamento caso o navegador negue acesso ao sessionStorage.
    }
  }

  router.push("/login");
}
