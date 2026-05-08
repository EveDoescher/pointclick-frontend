"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  ChevronRight,
  Headphones,
  Keyboard,
  Laptop,
  Monitor,
  Mouse,
  PackageSearch,
  ShieldCheck,
  Smartphone,
  Star,
  Truck,
  type LucideIcon,
} from "lucide-react";
import type { ProductResponse } from "@/types/product";
import { productService } from "@/services/productService";
import { buildPublicFileUrl } from "@/services/api";
import { useFeedbackModal } from "@/contexts/FeedbackModalContext";
import { formatCurrency } from "@/utils/formatters";

function categoryHref(category: string) {
  return `/produtos?category=${encodeURIComponent(category)}`;
}

function categoryGroupHref(categoryGroup: string) {
  return `/produtos?categoryGroup=${encodeURIComponent(categoryGroup)}`;
}

function categoryGroupsHref(categoryGroups: string[]) {
  return `/produtos?categoryGroup=${encodeURIComponent(categoryGroups.join(","))}`;
}

function sortHref(sort: string) {
  return `/produtos?sort=${encodeURIComponent(sort)}`;
}

const categoryLinks = [
  { label: "Ofertas", href: sortHref("price_asc") },
  { label: "Computadores e Mobile", href: categoryGroupHref("Computadores e Mobile") },
  { label: "Vídeo", href: categoryGroupHref("Vídeo") },
  { label: "Periféricos", href: categoryGroupHref("Periféricos") },
  { label: "Áudio", href: categoryGroupHref("Áudio") },
  { label: "Acessórios", href: categoryGroupHref("Acessórios") },
  { label: "Marcas", href: sortHref("name_asc") },
];

const departmentCards: {
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
}[] = [
  {
    title: "Computadores e Mobile",
    description: "Notebooks, tablets e smartphones para rotina e criação.",
    href: categoryGroupHref("Computadores e Mobile"),
    icon: Laptop,
  },
  {
    title: "Vídeo",
    description: "Imagem precisa para produtividade e entretenimento.",
    href: categoryGroupHref("Vídeo"),
    icon: Monitor,
  },
  {
    title: "Teclados",
    description: "Conforto e resposta para rotina e jogos.",
    href: categoryHref("Teclado"),
    icon: Keyboard,
  },
  {
    title: "Mouses",
    description: "Precisão premium para diferentes estilos.",
    href: categoryHref("Mouse"),
    icon: Mouse,
  },
  {
    title: "Áudio",
    description: "Fones e headsets com clareza e imersão.",
    href: categoryGroupHref("Áudio"),
    icon: Headphones,
  },
  {
    title: "Acessórios",
    description: "Essenciais para completar seu setup.",
    href: categoryGroupHref("Acessórios"),
    icon: Smartphone,
  },
];

const editorialCards = [
  {
    title: "Home Office",
    description: "Ajustes para uma rotina mais produtiva.",
    href: categoryGroupHref("Computadores e Mobile"),
    tone: "bg-[#F3F4F6]",
  },
  {
    title: "Gaming Room",
    description: "Equipamentos para precisão e resposta.",
    href: categoryGroupHref("Periféricos"),
    tone: "bg-[#EFEEE9]",
  },
  {
    title: "Áudio & Vídeo",
    description: "Som limpo e imagem com impacto.",
    href: categoryGroupsHref(["Áudio", "Vídeo"]),
    tone: "bg-[#F6F3EA]",
  },
];

const trustStripItems = [
  { icon: ShieldCheck, label: "Checkout seguro" },
  { icon: Truck, label: "Entrega para todo o Brasil" },
  { icon: Star, label: "Seleções em destaque" },
];

const CAROUSEL_VISIBLE_ITEMS = 4;

export default function HomePage() {
  const { showError } = useFeedbackModal();
  const [products, setProducts] = useState<ProductResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [carouselIndex, setCarouselIndex] = useState(0);

  const featuredProducts = useMemo(() => products.slice(0, 8), [products]);
  const heroProduct = featuredProducts[0];
  const productCarousel = featuredProducts;

  const visibleCarouselProducts = useMemo(
    () =>
      getVisibleCarouselProducts(
        productCarousel,
        carouselIndex,
        CAROUSEL_VISIBLE_ITEMS
      ),
    [productCarousel, carouselIndex]
  );

  const heroImageUrl = heroProduct
    ? buildPublicFileUrl(heroProduct.imageUrl) ?? ""
    : "";

  useEffect(() => {
    async function loadProducts() {
      setLoading(true);

      try {
        const response = await productService.findAll({
          available: true,
          sort: "newest",
        });

        setProducts(response);
        setCarouselIndex(0);
      } catch (error) {
        showError(error, "Erro ao carregar produtos");
      } finally {
        setLoading(false);
      }
    }

    loadProducts();
  }, [showError]);

  function handlePreviousProduct() {
    if (productCarousel.length <= 1) return;

    setCarouselIndex((current) =>
      current === 0 ? productCarousel.length - 1 : current - 1
    );
  }

  function handleNextProduct() {
    if (productCarousel.length <= 1) return;

    setCarouselIndex((current) =>
      current === productCarousel.length - 1 ? 0 : current + 1
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAF9] text-stone-900">
      <section className="border-b border-stone-200/80 bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-8 gap-y-2 px-4 py-3 lg:justify-between lg:px-8">
          {trustStripItems.map(({ icon: Icon, label }) => (
            <p key={label} className="inline-flex items-center gap-2 text-xs font-semibold text-stone-600">
              <Icon className="h-4 w-4 text-amber-700" aria-hidden />
              {label}
            </p>
          ))}
        </div>
      </section>

      <section className="px-4 pb-12 pt-8 lg:px-8 lg:pb-16 lg:pt-10">
        <div className="mx-auto grid max-w-7xl gap-4 lg:grid-cols-[1.25fr_.75fr]">
          <Link
            href={heroProduct ? `/produtos/${heroProduct.id}` : "/produtos"}
            className="group relative min-h-[420px] overflow-hidden rounded-[2rem] bg-[#EDE7D8] p-8 sm:p-10"
          >
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-stone-600">
              New In
            </p>
            <h1 className="mt-4 max-w-[24rem] font-[family-name:var(--font-rubik)] text-4xl font-semibold leading-[1.05] tracking-[-0.045em] text-stone-900 sm:text-5xl">
              Curadoria de tecnologia para novos espaços.
            </h1>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-stone-700">
              Descubra produtos pensados para rotina, criação e entretenimento.
            </p>
            <span className="mt-8 inline-flex items-center gap-2 text-sm font-bold text-stone-900">
              Ver seleção
              <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" aria-hidden />
            </span>

            <div className="pointer-events-none absolute bottom-0 right-0 flex h-[70%] w-[55%] items-end justify-center p-6">
              {heroImageUrl && heroProduct ? (
                <img
                  src={heroImageUrl}
                  alt={heroProduct.name}
                  className="max-h-[280px] w-full object-contain drop-shadow-[0_16px_28px_rgba(28,25,23,0.22)] transition duration-300 group-hover:scale-[1.03]"
                />
              ) : (
                <Laptop className="h-20 w-20 text-stone-500" aria-hidden />
              )}
            </div>
          </Link>

          <div className="grid gap-4">
            {editorialCards.slice(0, 2).map((item) => (
              <Link
                key={item.title}
                href={item.href}
                className={`group flex min-h-[202px] flex-col justify-between rounded-[1.6rem] border border-stone-200 p-6 transition hover:border-amber-500/50 ${item.tone}`}
              >
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-stone-500">
                    Edit
                  </p>
                  <h2 className="mt-3 font-[family-name:var(--font-rubik)] text-2xl font-semibold tracking-[-0.03em] text-stone-900">
                    {item.title}
                  </h2>
                </div>
                <p className="inline-flex items-center gap-2 text-sm font-semibold text-stone-700">
                  {item.description}
                  <ChevronRight className="h-4 w-4 transition group-hover:translate-x-0.5" aria-hidden />
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-12 lg:px-8 lg:py-16">
        <div className="mx-auto max-w-7xl">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-700">
                Descubra
              </p>
              <h2 className="mt-2 font-[family-name:var(--font-rubik)] text-3xl font-semibold tracking-[-0.04em] text-stone-900">
                Novidades da semana
              </h2>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href={sortHref("newest")}
                className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-stone-900 transition hover:border-stone-400"
              >
                Ver tudo
                <ChevronRight className="h-4 w-4" aria-hidden />
              </Link>

              {!loading && productCarousel.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={handlePreviousProduct}
                    className="inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-stone-300 bg-white text-stone-900 transition hover:border-amber-500/50"
                    aria-label="Produto anterior"
                  >
                    <ArrowLeft className="h-4 w-4" aria-hidden />
                  </button>
                  <button
                    type="button"
                    onClick={handleNextProduct}
                    className="inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-stone-300 bg-white text-stone-900 transition hover:border-amber-500/50"
                    aria-label="Próximo produto"
                  >
                    <ArrowRight className="h-4 w-4" aria-hidden />
                  </button>
                </>
              )}
            </div>
          </div>

          {loading ? (
            <ProductCarouselSkeleton />
          ) : productCarousel.length === 0 ? (
            <EmptyProducts />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {visibleCarouselProducts.map((product, index) => (
                <CatalogProductCard
                  key={`${product.id}-${carouselIndex}-${index}`}
                  product={product}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="px-4 pb-10 lg:px-8 lg:pb-12">
        <div className="mx-auto max-w-7xl">
          <Link
            href={editorialCards[2].href}
            className={`group block rounded-[2rem] border border-stone-200 p-8 sm:p-10 ${editorialCards[2].tone}`}
          >
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-stone-500">
              Coleção
            </p>
            <h2 className="mt-4 max-w-xl font-[family-name:var(--font-rubik)] text-3xl font-semibold tracking-[-0.04em] text-stone-900 sm:text-4xl">
              {editorialCards[2].title}
            </h2>
            <p className="mt-3 max-w-lg text-sm text-stone-700">
              {editorialCards[2].description}
            </p>
            <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-stone-900">
              Conhecer peças
              <ChevronRight className="h-4 w-4 transition group-hover:translate-x-0.5" aria-hidden />
            </span>
          </Link>
        </div>
      </section>

      <section className="px-4 pb-14 lg:px-8 lg:pb-16">
        <div className="mx-auto max-w-7xl border-t border-stone-200 pt-10">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
            <h2 className="font-[family-name:var(--font-rubik)] text-3xl font-semibold tracking-[-0.04em] text-stone-900">
              Navegue por categoria
            </h2>
            <Link
              href="/produtos"
              className="inline-flex cursor-pointer items-center gap-2 text-sm font-bold text-stone-900 hover:text-amber-800"
            >
              Ver tudo
              <ChevronRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {departmentCards.map((department) => (
              <DepartmentCard key={department.title} {...department} />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function getVisibleCarouselProducts(
  products: ProductResponse[],
  startIndex: number,
  count: number
) {
  if (products.length === 0) return [];

  if (products.length <= count) {
    return products;
  }

  return Array.from({ length: count }, (_, index) => {
    const productIndex = (startIndex + index) % products.length;
    return products[productIndex];
  });
}

function CatalogProductCard({ product }: { product: ProductResponse }) {
  const imageUrl = buildPublicFileUrl(product.imageUrl) ?? "";
  const unavailable =
    product.outOfStock || product.availableQuantity <= 0 || !product.active;

  return (
    <Link
      href={`/produtos/${product.id}`}
      className="group flex min-h-0 flex-col overflow-hidden rounded-3xl border border-stone-200 bg-white transition cursor-pointer hover:border-stone-300 hover:shadow-[0_12px_32px_rgba(28,25,23,0.06)]"
    >
      <div className="relative flex aspect-[4/5] max-h-[260px] w-full items-center justify-center border-b border-stone-100 bg-[#f4f1eb] p-6">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={product.name}
            className="max-h-full max-w-full object-contain object-center transition duration-300 group-hover:opacity-95"
          />
        ) : (
          <PackageSearch className="h-14 w-14 text-stone-400" aria-hidden />
        )}

        {unavailable && (
          <span className="absolute left-5 top-5 rounded-full bg-white/95 px-3 py-1 text-xs font-bold text-[var(--pc-danger)] shadow-sm backdrop-blur">
            Indisponível
          </span>
        )}

        {!unavailable && product.lowStock && (
          <span className="absolute left-5 top-5 rounded-full border border-stone-200 bg-white/95 px-3 py-1 text-xs font-semibold text-stone-700 shadow-sm backdrop-blur">
            Últimas unidades
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-center justify-between gap-3">
          <p className="line-clamp-1 text-[11px] font-bold uppercase tracking-[0.16em] text-stone-500">
            {product.brand}
          </p>

          {product.reviewCount > 0 && (
            <span className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-stone-600">
              <Star className="h-3.5 w-3.5 text-[var(--pc-purple)]" fill="currentColor" aria-hidden />
              {product.averageRating.toFixed(1)}
            </span>
          )}
        </div>

        <h3 className="mt-3 line-clamp-2 min-h-11 font-[family-name:var(--font-rubik)] text-base font-semibold leading-6 text-stone-900">
          {product.name}
        </h3>

        <div className="mt-auto pt-5">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-stone-500">
            Preço
          </p>
          <p className="mt-1 break-words font-[family-name:var(--font-rubik)] text-xl font-semibold tabular-nums tracking-tight text-stone-900">
            {formatCurrency(product.price)}
          </p>
        </div>
      </div>
    </Link>
  );
}

function DepartmentCard({
  title,
  description,
  href,
  icon: Icon,
}: {
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
}) {
  return (
    <Link
      href={href}
      className="group rounded-2xl border border-stone-200 bg-[#FAFAF9] p-5 transition cursor-pointer hover:border-amber-500/35 hover:bg-white"
    >
      <div className="flex items-start justify-between gap-4">
        <Icon className="h-6 w-6 text-stone-900" aria-hidden />
        <ChevronRight
          className="h-4 w-4 text-stone-400 transition group-hover:translate-x-0.5 group-hover:text-amber-700"
          aria-hidden
        />
      </div>
      <h3 className="mt-7 font-[family-name:var(--font-rubik)] text-lg font-semibold tracking-[-0.03em] text-stone-900">
        {title}
      </h3>
      <p className="mt-2 max-w-sm text-sm text-stone-600">{description}</p>
    </Link>
  );
}

function EmptyProducts() {
  return (
    <div className="rounded-3xl border border-stone-200 bg-white p-12 text-center">
      <PackageSearch className="mx-auto h-10 w-10 text-stone-400" aria-hidden />
      <h3 className="mt-5 font-[family-name:var(--font-rubik)] text-xl font-semibold text-stone-900">
        Nenhum produto disponível
      </h3>
      <p className="mt-2 text-sm text-stone-600">
        Novos produtos aparecerão aqui assim que forem cadastrados.
      </p>
    </div>
  );
}

function ProductCarouselSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <div
          key={index}
          className="overflow-hidden rounded-3xl border border-stone-200 bg-white"
        >
          <div className="h-[260px] animate-pulse bg-stone-200/80" />
          <div className="space-y-3 p-5">
            <div className="h-3 w-20 animate-pulse rounded bg-stone-200" />
            <div className="h-5 w-full animate-pulse rounded bg-stone-200" />
            <div className="h-5 w-3/4 animate-pulse rounded bg-stone-200" />
            <div className="h-6 w-28 animate-pulse rounded bg-stone-200" />
          </div>
        </div>
      ))}
    </div>
  );
}
