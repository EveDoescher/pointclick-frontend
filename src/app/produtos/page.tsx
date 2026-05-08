"use client";

import {
  Suspense,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  BadgeCheck,
  ChevronRight,
  Filter,
  Heart,
  Loader2,
  PackageSearch,
  Search,
  ShoppingCart,
  SlidersHorizontal,
  Star,
  X,
} from "lucide-react";
import type {
  ProductFilters,
  ProductResponse,
  ProductSort,
} from "@/types/product";
import { productService } from "@/services/productService";
import { favoriteService } from "@/services/favoriteService";
import { buildPublicFileUrl } from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { useFeedbackModal } from "@/contexts/FeedbackModalContext";
import { formatCurrency } from "@/utils/formatters";

const sortOptions: { value: ProductSort; label: string }[] = [
  { value: "newest", label: "Mais recentes" },
  { value: "price_asc", label: "Menor preço" },
  { value: "price_desc", label: "Maior preço" },
  { value: "name_asc", label: "Nome A-Z" },
];

function ProductsCatalogPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const searchFromUrl = searchParams.get("search") ?? "";
  const categoryGroupFromUrl = searchParams.get("categoryGroup") ?? "";
  const categoryFromUrl = searchParams.get("category") ?? "";

  const { isAuthenticated } = useAuth();
  const { addToCart } = useCart();
  const { showError, showInfo } = useFeedbackModal();

  const [products, setProducts] = useState<ProductResponse[]>([]);
  const [categoryGroups, setCategoryGroups] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [brands, setBrands] = useState<string[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<Set<number>>(new Set());
  const [addingProductId, setAddingProductId] = useState<number | null>(null);
  const [favoriteLoadingId, setFavoriteLoadingId] = useState<number | null>(
    null
  );
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const [filters, setFilters] = useState<ProductFilters>({
    search: searchFromUrl,
    categoryGroup: categoryGroupFromUrl,
    category: categoryFromUrl,
    brand: "",
    minPrice: "",
    maxPrice: "",
    available: true,
    sort: "newest",
  });

  const activeFilterLabels = useMemo(() => {
    const labels: { key: keyof ProductFilters | "available"; label: string }[] =
      [];

    if (filters.search) {
      labels.push({ key: "search", label: `Busca: ${filters.search}` });
    }

    if (filters.categoryGroup) {
      labels.push({
        key: "categoryGroup",
        label: `Grupo: ${filters.categoryGroup}`,
      });
    }

    if (filters.category) {
      labels.push({ key: "category", label: `Categoria: ${filters.category}` });
    }

    if (filters.brand) {
      labels.push({ key: "brand", label: `Marca: ${filters.brand}` });
    }

    if (filters.minPrice !== "" && filters.minPrice !== undefined) {
      labels.push({
        key: "minPrice",
        label: `A partir de R$ ${filters.minPrice}`,
      });
    }

    if (filters.maxPrice !== "" && filters.maxPrice !== undefined) {
      labels.push({ key: "maxPrice", label: `Até R$ ${filters.maxPrice}` });
    }

    if (filters.available === true) {
      labels.push({ key: "available", label: "Disponíveis" });
    }

    return labels;
  }, [filters]);

  const activeFilterCount = activeFilterLabels.length;

  const pageTitle = filters.search
    ? `Resultado para “${filters.search}”`
    : filters.category
      ? filters.category
      : filters.categoryGroup
        ? filters.categoryGroup
        : "Eletrônicos e acessórios";

  useEffect(() => {
    setFilters((current) => {
      if (
        current.search === searchFromUrl &&
        current.categoryGroup === categoryGroupFromUrl &&
        current.category === categoryFromUrl
      ) {
        return current;
      }

      return {
        ...current,
        search: searchFromUrl,
        categoryGroup: categoryGroupFromUrl,
        category: categoryFromUrl,
      };
    });
  }, [searchFromUrl, categoryGroupFromUrl, categoryFromUrl]);

  useEffect(() => {
    async function loadFilterOptions() {
      try {
        const [categoryGroupResponse, categoryResponse, brandResponse] =
          await Promise.all([
            productService.findCategoryGroups(),
            productService.findCategories(),
            productService.findBrands(),
          ]);

        setCategoryGroups(categoryGroupResponse);
        setCategories(categoryResponse);
        setBrands(brandResponse);
      } catch (error) {
        showError(error, "Erro ao carregar filtros");
      }
    }

    loadFilterOptions();
  }, [showError]);

  useEffect(() => {
    const timeoutId = window.setTimeout(async () => {
      setLoading(true);

      try {
        const response = await productService.findAll(filters);
        setProducts(response);
      } catch (error) {
        showError(error, "Erro ao carregar produtos");
      } finally {
        setLoading(false);
      }
    }, 280);

    return () => window.clearTimeout(timeoutId);
  }, [filters, showError]);

  useEffect(() => {
    let mounted = true;

    async function loadFavorites() {
      if (!isAuthenticated || products.length === 0) {
        setFavoriteIds(new Set());
        return;
      }

      try {
        const entries = await Promise.all(
          products.map(async (product) => {
            const exists = await favoriteService.existsForCurrentUser(
              product.id
            );
            return [product.id, exists] as const;
          })
        );

        if (!mounted) return;

        const nextFavorites = new Set<number>();

        entries.forEach(([productId, exists]) => {
          if (exists) {
            nextFavorites.add(productId);
          }
        });

        setFavoriteIds(nextFavorites);
      } catch {
        if (mounted) {
          setFavoriteIds(new Set());
        }
      }
    }

    loadFavorites();

    return () => {
      mounted = false;
    };
  }, [isAuthenticated, products]);

  function updateFilter<K extends keyof ProductFilters>(
    key: K,
    value: ProductFilters[K]
  ) {
    setFilters((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function removeFilter(key: keyof ProductFilters | "available") {
    setFilters((current) => {
      if (key === "available") {
        return {
          ...current,
          available: null,
        };
      }

      return {
        ...current,
        [key]: "",
      };
    });
  }

  function clearFilters() {
    setFilters({
      search: "",
      categoryGroup: "",
      category: "",
      brand: "",
      minPrice: "",
      maxPrice: "",
      available: true,
      sort: "newest",
    });
  }

  async function handleAddToCart(product: ProductResponse) {
    if (!isAuthenticated) {
      redirectToLoginAfterBlockedAction(
        router,
        "Só é possível adicionar produtos ao carrinho depois de fazer login.",
        "Login necessário"
      );
      return;
    }

    const unavailable =
      product.outOfStock || product.availableQuantity <= 0 || !product.active;

    if (unavailable) {
      showInfo("Este produto não está disponível para compra no momento.");
      return;
    }

    setAddingProductId(product.id);

    try {
      await addToCart(product, 1);
    } catch (error) {
      showError(error, "Erro ao adicionar produto");
    } finally {
      setAddingProductId(null);
    }
  }

  async function handleToggleFavorite(product: ProductResponse) {
    if (!isAuthenticated) {
      redirectToLoginAfterBlockedAction(
        router,
        "Só é possível adicionar produtos aos favoritos depois de fazer login.",
        "Login necessário"
      );
      return;
    }

    setFavoriteLoadingId(product.id);

    try {
      const isFavorited = favoriteIds.has(product.id);

      if (isFavorited) {
        await favoriteService.removeFavorite(product.id);

        setFavoriteIds((current) => {
          const next = new Set(current);
          next.delete(product.id);
          return next;
        });
      } else {
        await favoriteService.addFavorite(product.id);

        setFavoriteIds((current) => {
          const next = new Set(current);
          next.add(product.id);
          return next;
        });
      }
    } catch (error) {
      showError(error, "Erro ao atualizar favorito");
    } finally {
      setFavoriteLoadingId(null);
    }
  }

  return (
    <main className="min-h-screen bg-[#f8f7f3]">
      <section className="px-4 py-8 lg:px-8 lg:py-10">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-5 lg:grid-cols-[1.35fr_.65fr]">
            <div className="rounded-[1.5rem] border border-[var(--pc-border)] bg-white p-6 shadow-sm md:p-8">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--pc-purple)]">
                Catálogo
              </p>

              <h1 className="mt-3 max-w-4xl text-4xl font-semibold leading-[1.02] tracking-[-0.05em] text-[var(--pc-text)] md:text-5xl">
                {pageTitle}
              </h1>

              <p className="mt-4 max-w-2xl text-base leading-7 text-[var(--pc-text-muted)]">
                Produtos para trabalho, estudo, jogos e rotina conectada.
              </p>
            </div>

            <div className="rounded-[1.5rem] border border-[var(--pc-border)] bg-[#fbfaf7] p-6 shadow-sm">
              <BadgeCheck
                className="h-5 w-5 text-[var(--pc-purple)]"
                aria-hidden="true"
              />

              <p className="mt-4 text-sm font-semibold text-[var(--pc-text)]">
                Vitrine PointClick
              </p>

              <p className="mt-2 text-sm leading-6 text-[var(--pc-text-muted)]">
                {loading
                  ? "Carregando produtos..."
                  : `${products.length} produto(s) encontrado(s)`}
              </p>

              {activeFilterCount > 0 && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="mt-5 inline-flex text-sm font-semibold text-[var(--pc-text)] transition hover:text-[var(--pc-purple)]"
                >
                  Limpar filtros
                </button>
              )}
            </div>
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-[280px_1fr]">
            <aside className="hidden lg:block">
              <div className="sticky top-24 rounded-[1.5rem] border border-[var(--pc-border)] bg-white p-5 shadow-sm">
                <FilterPanel
                  filters={filters}
                  categoryGroups={categoryGroups}
                  categories={categories}
                  brands={brands}
                  onUpdateFilter={updateFilter}
                  onClearFilters={clearFilters}
                />
              </div>
            </aside>

            <section className="min-w-0">
              <div className="rounded-[1.5rem] border border-[var(--pc-border)] bg-white p-4 shadow-sm">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                  <label className="relative block flex-1">
                    <Search
                      className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--pc-text-muted)]"
                      aria-hidden="true"
                    />

                    <input
                      value={filters.search ?? ""}
                      onChange={(event) =>
                        updateFilter("search", event.target.value)
                      }
                      placeholder="Buscar produto, marca ou descrição"
                      className="h-12 w-full rounded-full border border-[var(--pc-border)] bg-[#fbfaf7] pl-11 pr-4 text-sm font-medium text-[var(--pc-text)] outline-none transition placeholder:text-[var(--pc-text-muted)] hover:border-[var(--pc-border-strong)] focus:border-[var(--pc-purple)] focus:bg-white"
                    />
                  </label>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() =>
                        setMobileFiltersOpen((current) => !current)
                      }
                      className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-[var(--pc-border)] bg-white px-4 text-sm font-semibold text-[var(--pc-text)] transition hover:border-[var(--pc-border-strong)] hover:bg-[#fbfaf7] lg:hidden"
                    >
                      <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
                      Filtros
                    </button>

                    <select
                      value={filters.sort ?? "newest"}
                      onChange={(event) =>
                        updateFilter("sort", event.target.value as ProductSort)
                      }
                      className="h-12 min-w-[180px] rounded-full border border-[var(--pc-border)] bg-white px-4 text-sm font-semibold text-[var(--pc-text)] outline-none transition hover:border-[var(--pc-border-strong)] focus:border-[var(--pc-purple)]"
                    >
                      {sortOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {mobileFiltersOpen && (
                  <div className="mt-4 border-t border-[var(--pc-border)] pt-4 lg:hidden">
                    <FilterPanel
                      filters={filters}
                      categoryGroups={categoryGroups}
                      categories={categories}
                      brands={brands}
                      onUpdateFilter={updateFilter}
                      onClearFilters={clearFilters}
                    />
                  </div>
                )}

                {activeFilterLabels.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2 border-t border-[var(--pc-border)] pt-4">
                    {activeFilterLabels.map((filter) => (
                      <button
                        key={`${filter.key}-${filter.label}`}
                        type="button"
                        onClick={() => removeFilter(filter.key)}
                        className="inline-flex items-center gap-2 rounded-full border border-[var(--pc-border)] bg-[#fbfaf7] px-3 py-2 text-xs font-semibold text-[var(--pc-text-soft)] transition hover:border-[var(--pc-border-strong)] hover:text-[var(--pc-text)]"
                      >
                        {filter.label}
                        <X className="h-3.5 w-3.5" aria-hidden="true" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-5">
                {loading ? (
                  <ProductGridSkeleton />
                ) : products.length === 0 ? (
                  <EmptyProducts onClearFilters={clearFilters} />
                ) : (
                  <div className="grid gap-5 sm:grid-cols-2 2xl:grid-cols-3">
                    {products.map((product) => (
                      <CatalogProductCard
                        key={product.id}
                        product={product}
                        favorited={favoriteIds.has(product.id)}
                        favoriteLoading={favoriteLoadingId === product.id}
                        adding={addingProductId === product.id}
                        onToggleFavorite={handleToggleFavorite}
                        onAddToCart={handleAddToCart}
                      />
                    ))}
                  </div>
                )}
              </div>
            </section>
          </div>
        </div>
      </section>
    </main>
  );
}

function FilterPanel({
  filters,
  categoryGroups,
  categories,
  brands,
  onUpdateFilter,
  onClearFilters,
}: {
  filters: ProductFilters;
  categoryGroups: string[];
  categories: string[];
  brands: string[];
  onUpdateFilter: <K extends keyof ProductFilters>(
    key: K,
    value: ProductFilters[K]
  ) => void;
  onClearFilters: () => void;
}) {
  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--pc-purple)]">
            Filtros
          </p>
          <h2 className="mt-1 text-lg font-semibold text-[var(--pc-text)]">
            Refinar busca
          </h2>
        </div>

        <button
          type="button"
          onClick={onClearFilters}
          className="text-sm font-semibold text-[var(--pc-text-muted)] transition hover:text-[var(--pc-text)]"
        >
          Limpar
        </button>
      </div>

      <div className="mt-6 space-y-6">
        <FilterGroup title="Grupo">
          <select
            value={filters.categoryGroup ?? ""}
            onChange={(event) =>
              onUpdateFilter("categoryGroup", event.target.value)
            }
            className="h-11 w-full rounded-full border border-[var(--pc-border)] bg-white px-4 text-sm font-semibold text-[var(--pc-text)] outline-none transition hover:border-[var(--pc-border-strong)] focus:border-[var(--pc-purple)]"
          >
            <option value="">Todos</option>
            {categoryGroups.map((group) => (
              <option key={group} value={group}>
                {group}
              </option>
            ))}
          </select>
        </FilterGroup>

        <FilterGroup title="Categoria">
          <select
            value={filters.category ?? ""}
            onChange={(event) => onUpdateFilter("category", event.target.value)}
            className="h-11 w-full rounded-full border border-[var(--pc-border)] bg-white px-4 text-sm font-semibold text-[var(--pc-text)] outline-none transition hover:border-[var(--pc-border-strong)] focus:border-[var(--pc-purple)]"
          >
            <option value="">Todas</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </FilterGroup>

        <FilterGroup title="Marca">
          <select
            value={filters.brand ?? ""}
            onChange={(event) => onUpdateFilter("brand", event.target.value)}
            className="h-11 w-full rounded-full border border-[var(--pc-border)] bg-white px-4 text-sm font-semibold text-[var(--pc-text)] outline-none transition hover:border-[var(--pc-border-strong)] focus:border-[var(--pc-purple)]"
          >
            <option value="">Todas</option>
            {brands.map((brand) => (
              <option key={brand} value={brand}>
                {brand}
              </option>
            ))}
          </select>
        </FilterGroup>

        <FilterGroup title="Preço">
          <div className="grid grid-cols-2 gap-3">
            <input
              type="number"
              min="0"
              value={filters.minPrice ?? ""}
              onChange={(event) =>
                onUpdateFilter(
                  "minPrice",
                  event.target.value === "" ? "" : Number(event.target.value)
                )
              }
              placeholder="Mín."
              className="h-11 rounded-full border border-[var(--pc-border)] bg-white px-4 text-sm font-medium text-[var(--pc-text)] outline-none transition placeholder:text-[var(--pc-text-muted)] hover:border-[var(--pc-border-strong)] focus:border-[var(--pc-purple)]"
            />

            <input
              type="number"
              min="0"
              value={filters.maxPrice ?? ""}
              onChange={(event) =>
                onUpdateFilter(
                  "maxPrice",
                  event.target.value === "" ? "" : Number(event.target.value)
                )
              }
              placeholder="Máx."
              className="h-11 rounded-full border border-[var(--pc-border)] bg-white px-4 text-sm font-medium text-[var(--pc-text)] outline-none transition placeholder:text-[var(--pc-text-muted)] hover:border-[var(--pc-border-strong)] focus:border-[var(--pc-purple)]"
            />
          </div>
        </FilterGroup>

        <label className="flex cursor-pointer items-center justify-between gap-4 rounded-[1.25rem] border border-[var(--pc-border)] bg-[#fbfaf7] p-4 text-sm font-semibold text-[var(--pc-text-soft)]">
          <span>Mostrar apenas disponíveis</span>

          <input
            type="checkbox"
            checked={filters.available === true}
            onChange={(event) =>
              onUpdateFilter("available", event.target.checked ? true : null)
            }
            className="h-4 w-4 accent-[var(--pc-text)]"
          />
        </label>
      </div>
    </div>
  );
}

function FilterGroup({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div>
      <p className="mb-3 text-sm font-semibold text-[var(--pc-text)]">
        {title}
      </p>
      {children}
    </div>
  );
}

function CatalogProductCard({
  product,
  favorited,
  favoriteLoading,
  adding,
  onToggleFavorite,
  onAddToCart,
}: {
  product: ProductResponse;
  favorited: boolean;
  favoriteLoading: boolean;
  adding: boolean;
  onToggleFavorite: (product: ProductResponse) => void;
  onAddToCart: (product: ProductResponse) => void;
}) {
  const imageUrl = buildPublicFileUrl(product.imageUrl) ?? "";
  const unavailable =
    product.outOfStock || product.availableQuantity <= 0 || !product.active;

  return (
    <article className="group flex min-h-0 flex-col overflow-hidden rounded-[1.5rem] border border-[var(--pc-border)] bg-white shadow-sm transition hover:border-[#cfc8bc] hover:bg-[#fbfaf7]">
      <div className="relative flex aspect-[4/5] max-h-[300px] w-full shrink-0 items-center justify-center bg-[#f4f1eb] p-5 sm:p-6">
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
            <PackageSearch
              className="mb-8 h-14 w-14 text-[var(--pc-text-muted)]"
              aria-hidden="true"
            />
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
          onClick={() => onToggleFavorite(product)}
          disabled={favoriteLoading}
          className={`absolute right-5 top-5 flex h-10 w-10 items-center justify-center rounded-full bg-white text-[var(--pc-text-muted)] shadow-sm transition hover:text-[var(--pc-purple)] disabled:cursor-not-allowed disabled:opacity-60 ${
            favorited ? "text-[var(--pc-purple)]" : ""
          }`}
          aria-label={
            favorited ? "Remover dos favoritos" : "Adicionar aos favoritos"
          }
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
          <h2 className="mt-3 line-clamp-2 min-h-11 text-base font-semibold leading-6 text-[var(--pc-text)] transition group-hover:text-[var(--pc-purple)]">
            {product.name}
          </h2>
        </Link>

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
              onClick={() => onAddToCart(product)}
              disabled={unavailable || adding}
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

function EmptyProducts({ onClearFilters }: { onClearFilters: () => void }) {
  return (
    <div className="rounded-[1.5rem] border border-[var(--pc-border)] bg-white p-12 text-center shadow-sm">
      <PackageSearch
        className="mx-auto h-10 w-10 text-[var(--pc-text-muted)]"
        aria-hidden="true"
      />

      <h2 className="mt-5 text-2xl font-semibold text-[var(--pc-text)]">
        Nenhum produto encontrado
      </h2>

      <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-[var(--pc-text-muted)]">
        Tente remover alguns filtros ou buscar por outro termo.
      </p>

      <button
        type="button"
        onClick={onClearFilters}
        className="mt-6 inline-flex h-11 items-center justify-center rounded-full bg-[var(--pc-text)] px-5 text-sm font-semibold text-white transition hover:bg-[#302920]"
      >
        Limpar filtros
      </button>
    </div>
  );
}

function ProductGridSkeleton() {
  return (
    <div className="grid gap-5 sm:grid-cols-2 2xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <div
          key={index}
          className="overflow-hidden rounded-[1.5rem] border border-[var(--pc-border)] bg-white shadow-sm"
        >
          <div className="h-[285px] animate-pulse bg-[var(--pc-surface-muted)]" />

          <div className="space-y-3 p-5">
            <div className="h-3 w-20 animate-pulse rounded bg-[var(--pc-surface-muted)]" />
            <div className="h-5 w-full animate-pulse rounded bg-[var(--pc-surface-muted)]" />
            <div className="h-5 w-3/4 animate-pulse rounded bg-[var(--pc-surface-muted)]" />
            <div className="h-6 w-28 animate-pulse rounded bg-[var(--pc-surface-muted)]" />
            <div className="h-11 w-full animate-pulse rounded-full bg-[var(--pc-surface-muted)]" />
          </div>
        </div>
      ))}
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

export default function ProductsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#FAFAF9] px-4 py-10 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <ProductGridSkeleton />
          </div>
        </div>
      }
    >
      <ProductsCatalogPage />
    </Suspense>
  );
}
