"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Heart } from "lucide-react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import type { FavoriteResponse } from "@/types/favorite";
import { favoriteService } from "@/services/favoriteService";
import { ProductCard } from "@/components/products/ProductCard";
import { useFeedbackModal } from "@/contexts/FeedbackModalContext";

export default function FavoritesPage() {
  return (
    <ProtectedRoute>
      <FavoritesContent />
    </ProtectedRoute>
  );
}

function FavoritesContent() {
  const { showError } = useFeedbackModal();

  const [favorites, setFavorites] = useState<FavoriteResponse[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadFavorites() {
    setLoading(true);

    try {
      const response = await favoriteService.findMyFavorites();
      setFavorites(response);
    } catch (error) {
      showError(error, "Erro ao carregar favoritos");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadFavorites();
  }, []);

  return (
    <div className="min-h-screen bg-[#FAFAF9] px-4 py-10 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="border-b border-stone-200 pb-8">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                Conta
              </p>
              <h1 className="mt-2 font-[family-name:var(--font-rubik)] text-3xl font-semibold tracking-[-0.04em] text-stone-900 sm:text-4xl">
                Favoritos
                {!loading && (
                  <span className="ml-2 text-lg font-normal text-stone-500">
                    ({favorites.length})
                  </span>
                )}
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-stone-600">
                Mesmos cartões do catálogo: preço completo, imagem centralizada e
                ações discretas.
              </p>
            </div>
            <Link href="/produtos" className="pc-btn pc-btn-secondary shrink-0 text-sm">
              Ver catálogo
            </Link>
          </div>
        </header>

        {loading ? (
          <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="h-[480px] animate-pulse rounded-[2rem] bg-stone-200/90"
              />
            ))}
          </div>
        ) : favorites.length === 0 ? (
          <section className="mt-10 rounded-xl border border-stone-200 bg-white p-10 text-center shadow-sm">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[1.5rem] bg-stone-100 text-stone-500">
              <Heart className="h-9 w-9" aria-hidden="true" />
            </div>

            <h2 className="mt-7 font-[family-name:var(--font-rubik)] text-2xl font-semibold text-stone-900">
              Nenhum favorito ainda
            </h2>

            <p className="mt-3 text-stone-600">
              Favorite produtos para montar sua lista de desejos.
            </p>

            <Link
              href="/produtos"
              className="mt-7 inline-flex rounded-full border border-[var(--pc-purple)] bg-[var(--pc-purple)] px-5 py-3 text-sm font-semibold !text-white shadow-sm transition hover:bg-[var(--pc-purple-hover)]"
            >
              Ver produtos
            </Link>
          </section>
        ) : (
          <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {favorites.map((favorite) => (
              <ProductCard key={favorite.id} product={favorite.product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}