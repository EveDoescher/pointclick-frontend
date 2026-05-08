import type { ProductResponse } from "./product";

export type FavoriteResponse = {
  id: number;
  userId: number;
  product: ProductResponse;
  createdAt: string;
};

export type FavoriteExistsResponse = {
  favorited: boolean;
};