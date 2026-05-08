import type { ProductResponse } from "@/types/product";

export const productFixture: ProductResponse = {
  id: 1,
  name: "Notebook PointClick Pro",
  description: "Notebook premium para produtividade.",
  categoryGroup: "Computadores e Mobile",
  category: "Notebook",
  brand: "PointClick",
  model: "PC-Pro-14",
  price: 4999.9,
  stockQuantity: 20,
  reservedQuantity: 2,
  availableQuantity: 18,
  imageUrl: "/uploads/products/notebook.png",
  active: true,
  outOfStock: false,
  lowStock: false,
  favoriteCount: 3,
  reviewCount: 2,
  averageRating: 4.5,
  createdAt: "2026-05-01T10:00:00Z",
  updatedAt: "2026-05-01T10:00:00Z",
};

export function makeProductFixture(
  overrides: Partial<ProductResponse> = {}
): ProductResponse {
  return {
    ...productFixture,
    ...overrides,
  };
}
