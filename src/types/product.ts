export type ProductResponse = {
  id: number;
  name: string;
  description: string;
  categoryGroup: string;
  category: string;
  brand: string;
  model: string | null;
  price: number;
  stockQuantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  imageUrl: string | null;
  active: boolean;
  outOfStock: boolean;
  lowStock: boolean;
  favoriteCount: number;
  reviewCount: number;
  averageRating: number;
  createdAt: string;
  updatedAt: string;
};

export type CreateProductRequest = {
  name: string;
  description: string;
  categoryGroup: string;
  category: string;
  brand: string;
  model?: string | null;
  price: number;
  stockQuantity: number;
  imageUrl?: string | null;
  active: boolean;
};

export type UpdateProductRequest = CreateProductRequest;

export type ProductFilters = {
  search?: string;
  categoryGroup?: string;
  category?: string;
  brand?: string;
  minPrice?: number | "";
  maxPrice?: number | "";
  available?: boolean | null;
  active?: boolean | null;
  sort?: ProductSort;
};

export type ProductSort = "newest" | "price_asc" | "price_desc" | "name_asc";