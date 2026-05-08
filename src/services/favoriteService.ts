import type { FavoriteExistsResponse, FavoriteResponse } from "@/types/favorite";
import { apiFetch } from "./api";

export const favoriteService = {
  async findMyFavorites(): Promise<FavoriteResponse[]> {
    return apiFetch<FavoriteResponse[]>("/favorites", {
      method: "GET",
    });
  },

  async addFavorite(productId: number): Promise<FavoriteResponse> {
    return apiFetch<FavoriteResponse>(`/favorites/products/${productId}`, {
      method: "POST",
    });
  },

  async removeFavorite(productId: number): Promise<void> {
    return apiFetch<void>(`/favorites/products/${productId}`, {
      method: "DELETE",
    });
  },

  async existsForCurrentUser(productId: number): Promise<boolean> {
    const response = await apiFetch<FavoriteExistsResponse>(
      `/favorites/products/${productId}/exists`,
      {
        method: "GET",
      }
    );

    return response.favorited;
  },
};