"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronRight,
  Heart,
  Laptop,
  Loader2,
  Pencil,
  Power,
  PowerOff,
  ShoppingCart,
  Star,
} from "lucide-react";
import type { ProductResponse } from "@/types/product";
import { buildPublicFileUrl } from "@/services/api";
import { favoriteService } from "@/services/favoriteService";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { useFeedbackModal } from "@/contexts/FeedbackModalContext";
import { formatCurrency } from "@/utils/formatters";

type ProductCardProps = {
  product: ProductResponse;
  compact?: boolean;
  showAdminStatus?: boolean;
  onAdminEdit?: (product: ProductResponse) => void;
  onAdminToggleActive?: (product: ProductResponse) => void;
};

export function ProductCard({
  product,
  compact = false,
  showAdminStatus = false,
  onAdminEdit,
  onAdminToggleActive,
}: ProductCardProps) {
  if (showAdminStatus) {
    return (
      <AdminProductCard
        product={product}
        onAdminEdit={onAdminEdit}
        onAdminToggleActive={onAdminToggleActive}
      />
    );
  }

  return <StoreProductCard product={product} compact={compact} />;
}

function StoreProductCard({
  product,
  compact,
}: {
  product: ProductResponse;
  compact: boolean;
}) {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const { addToCart, actionLoading } = useCart();
  const { showError, showInfo } = useFeedbackModal();

  const [favorited, setFavorited] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const [adding, setAdding] = useState(false);

  const imageUrl = buildPublicFileUrl(product.imageUrl) ?? "";
  const unavailable =
    product.outOfStock || product.availableQuantity <= 0 || !product.active;

  const imageAspect = compact ? "aspect-[3/4] max-h-[220px]" : "aspect-[4/5] max-h-[300px]";

  useEffect(() => {
    let mounted = true;

    async function loadFavoriteStatus() {
      if (!isAuthenticated) {
        setFavorited(false);
        return;
      }

      try {
        const exists = await favoriteService.existsForCurrentUser(product.id);

        if (mounted) {
          setFavorited(exists);
        }
      } catch {
        if (mounted) {
          setFavorited(false);
        }
      }
    }

    loadFavoriteStatus();

    return () => {
      mounted = false;
    };
  }, [isAuthenticated, product.id]);

  async function handleAddToCart() {
    if (!isAuthenticated) {
      redirectToLoginAfterBlockedAction(
        router,
        "Só é possível adicionar produtos ao carrinho depois de fazer login.",
        "Login necessário"
      );
      return;
    }

    if (unavailable) {
      showInfo("Este produto não está disponível para compra no momento.");
      return;
    }

    setAdding(true);

    try {
      await addToCart(product, 1);
    } catch (error) {
      showError(error, "Erro ao adicionar produto");
    } finally {
      setAdding(false);
    }
  }

  async function handleToggleFavorite() {
    if (!isAuthenticated) {
      redirectToLoginAfterBlockedAction(
        router,
        "Só é possível adicionar produtos aos favoritos depois de fazer login.",
        "Login necessário"
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

  return (
    <article
      className={`group flex min-h-0 flex-col overflow-hidden rounded-[1.5rem] border border-[var(--pc-border)] bg-white shadow-sm transition hover:border-[#cfc8bc] hover:bg-[#fbfaf7]`}
    >
      <div
        className={`relative flex w-full shrink-0 items-center justify-center bg-[#f4f1eb] p-5 sm:p-6 ${imageAspect}`}
      >
        <Link
          href={`/produtos/${product.id}`}
          className="relative flex h-full max-h-full w-full items-center justify-center"
          aria-label={`Ver detalhes de ${product.name}`}
        >
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={product.name}
              className="max-h-full max-w-full object-contain object-center transition duration-300 group-hover:opacity-95"
            />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-[var(--pc-text-muted)] shadow-sm">
              <Laptop className="h-8 w-8" aria-hidden="true" />
            </div>
          )}
        </Link>

        {unavailable && (
          <span className="absolute left-5 top-5 rounded-full bg-white px-3 py-1 text-xs font-bold text-[var(--pc-danger)] shadow-sm">
            Indisponível
          </span>
        )}

        {!unavailable && product.lowStock && (
          <span className="absolute left-5 top-5 rounded-full bg-white px-3 py-1 text-xs font-bold text-[var(--pc-warning)] shadow-sm">
            Últimas unidades
          </span>
        )}

        <button
          type="button"
          onClick={handleToggleFavorite}
          disabled={favoriteLoading}
          className={`absolute right-5 top-5 flex h-10 w-10 items-center justify-center rounded-full bg-white text-[var(--pc-text-muted)] shadow-sm transition hover:text-[var(--pc-purple)] disabled:cursor-not-allowed disabled:opacity-60 ${
            favorited ? "text-[var(--pc-purple)]" : ""
          }`}
          aria-label={favorited ? "Remover dos favoritos" : "Adicionar aos favoritos"}
        >
          {favoriteLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <Heart
              className="h-4 w-4"
              fill={favorited ? "currentColor" : "none"}
              aria-hidden="true"
            />
          )}
        </button>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-center justify-between gap-3">
          <p className="line-clamp-1 text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--pc-text-muted)]">
            {product.brand}
          </p>

          {product.reviewCount > 0 && (
            <span className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-[var(--pc-text-soft)]">
              <Star
                className="h-3.5 w-3.5 text-[var(--pc-warning)]"
                fill="currentColor"
                aria-hidden="true"
              />
              {product.averageRating.toFixed(1)}
            </span>
          )}
        </div>

        <Link href={`/produtos/${product.id}`}>
          <h3 className="mt-3 line-clamp-2 min-h-11 text-base font-semibold leading-6 text-[var(--pc-text)] transition group-hover:text-[var(--pc-purple)]">
            {product.name}
          </h3>
        </Link>

        {!compact && product.description && (
          <p className="mt-3 line-clamp-2 text-sm leading-6 text-[var(--pc-text-muted)]">
            {product.description}
          </p>
        )}

        <div className="mt-auto border-t border-[var(--pc-border)]/60 pt-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--pc-text-muted)]">
            Preço
          </p>
          <p className="mt-1 break-words text-xl font-semibold tabular-nums tracking-tight text-[var(--pc-text)]">
            {formatCurrency(product.price)}
          </p>

          <div className="mt-4 grid grid-cols-[1fr_auto] gap-3">
            <button
              type="button"
              onClick={handleAddToCart}
              disabled={unavailable || adding || actionLoading}
              className="pc-btn pc-btn-secondary inline-flex h-11 min-h-0 items-center justify-center gap-2 px-4 py-0 text-sm disabled:cursor-not-allowed disabled:opacity-50"
            >
              {adding ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  Adicionando
                </>
              ) : unavailable ? (
                "Indisponível"
              ) : (
                <>
                  <ShoppingCart className="h-4 w-4" aria-hidden="true" />
                  Adicionar
                </>
              )}
            </button>

            <Link
              href={`/produtos/${product.id}`}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[var(--pc-border)] bg-white text-[var(--pc-text)] transition hover:border-[var(--pc-border-strong)] hover:bg-[#fbfaf7]"
              aria-label={`Ver ${product.name}`}
            >
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}

function AdminProductCard({
  product,
  onAdminEdit,
  onAdminToggleActive,
}: {
  product: ProductResponse;
  onAdminEdit?: (product: ProductResponse) => void;
  onAdminToggleActive?: (product: ProductResponse) => void;
}) {
  const imageUrl = buildPublicFileUrl(product.imageUrl) ?? "";
  const unavailable =
    product.outOfStock || product.availableQuantity <= 0 || !product.active;

  return (
    <article className="overflow-hidden rounded-[1.5rem] border border-[var(--pc-border)] bg-white shadow-sm transition hover:border-[#cfc8bc] hover:bg-[#fbfaf7]">
      <div className="grid gap-0 md:grid-cols-[180px_1fr]">
        <Link
          href={`/produtos/${product.id}`}
          className="flex min-h-[160px] items-center justify-center bg-[#f4f1eb] p-5 md:min-h-[200px]"
        >
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={product.name}
              className="max-h-44 w-full max-w-[200px] object-contain object-center transition duration-300"
            />
          ) : (
            <Laptop
              className="mb-6 h-12 w-12 text-[var(--pc-text-muted)]"
              aria-hidden="true"
            />
          )}
        </Link>

        <div className="flex min-w-0 flex-col p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="line-clamp-1 text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--pc-text-muted)]">
                {product.brand}
              </p>

              <Link href={`/produtos/${product.id}`}>
                <h3 className="mt-2 line-clamp-2 text-lg font-semibold leading-6 tracking-[-0.025em] text-[var(--pc-text)] transition hover:text-[var(--pc-purple)]">
                  {product.name}
                </h3>
              </Link>
            </div>

            <span
              className={`rounded-full px-3 py-1 text-xs font-bold ${
                product.active
                  ? "bg-[var(--pc-green-soft)] text-[var(--pc-green)]"
                  : "bg-[var(--pc-bg-soft)] text-[var(--pc-text-muted)]"
              }`}
            >
              {product.active ? "Ativo" : "Inativo"}
            </span>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <AdminMetric label="Preço" value={formatCurrency(product.price)} />
            <AdminMetric label="Estoque" value={`${product.availableQuantity} un.`} />
            <AdminMetric
              label="Status"
              value={unavailable ? "Indisponível" : product.lowStock ? "Baixo" : "OK"}
            />
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--pc-border)] pt-4">
            <p className="line-clamp-1 text-sm text-[var(--pc-text-muted)]">
              {product.categoryGroup}
              {product.category ? ` · ${product.category}` : ""}
            </p>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => onAdminEdit?.(product)}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-full border border-[var(--pc-border)] bg-white px-4 text-sm font-semibold text-[var(--pc-text)] transition hover:border-[var(--pc-border-strong)] hover:bg-[#fbfaf7]"
              >
                <Pencil className="h-4 w-4" aria-hidden="true" />
                Editar
              </button>

              <button
                type="button"
                onClick={() => onAdminToggleActive?.(product)}
                className={`inline-flex h-10 items-center justify-center gap-2 rounded-full px-4 text-sm font-semibold text-white transition ${
                  product.active
                    ? "bg-[var(--pc-danger)] hover:bg-[var(--pc-danger-hover)]"
                    : "bg-[var(--pc-green)] hover:bg-[var(--pc-green-hover)]"
                }`}
              >
                {product.active ? (
                  <PowerOff className="h-4 w-4" aria-hidden="true" />
                ) : (
                  <Power className="h-4 w-4" aria-hidden="true" />
                )}
                {product.active ? "Desativar" : "Ativar"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

function AdminMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-[1rem] border border-[var(--pc-border)] bg-[#fbfaf7] p-3">
      <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--pc-text-muted)]">
        {label}
      </p>
      <p className="mt-1 break-words text-sm font-semibold tabular-nums text-[var(--pc-text)]">
        {value}
      </p>
    </div>
  );
}
const LOGIN_REDIRECT_PATH_KEY = "pointclick_login_redirect_path";
const LOGIN_REQUIRED_FEEDBACK_KEY = "pointclick_login_required_feedback";

function redirectToLoginAfterBlockedAction(
  router: ReturnType<typeof useRouter>,
  message: string,
  title: string
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
        })
      );
    } catch {
      // Não bloqueia o redirecionamento caso o navegador negue acesso ao sessionStorage.
    }
  }

  router.push("/login");
}

