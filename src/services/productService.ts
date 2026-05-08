import type {
  CreateProductRequest,
  ProductFilters,
  ProductResponse,
  UpdateProductRequest,
} from "@/types/product";
import { apiFetch, buildQueryParams } from "./api";

function normalizeProductFilters(filters: ProductFilters = {}) {
  return {
    search: filters.search,
    categoryGroup: filters.categoryGroup,
    category: filters.category,
    brand: filters.brand,
    minPrice: filters.minPrice,
    maxPrice: filters.maxPrice,
    available: filters.available,
    active: filters.active,
    sort: filters.sort ?? "newest",
  };
}

export const productService = {
  async findAll(filters: ProductFilters = {}): Promise<ProductResponse[]> {
    const normalizedFilters = normalizeProductFilters(filters);

    const query = buildQueryParams({
      search: normalizedFilters.search,
      categoryGroup: normalizedFilters.categoryGroup,
      category: normalizedFilters.category,
      brand: normalizedFilters.brand,
      minPrice: normalizedFilters.minPrice,
      maxPrice: normalizedFilters.maxPrice,
      available: normalizedFilters.available,
      sort: normalizedFilters.sort,
    });

    return apiFetch<ProductResponse[]>(`/products${query}`, {
      method: "GET",
      auth: false,
    });
  },

  async findAllForAdmin(
    filters: ProductFilters = {}
  ): Promise<ProductResponse[]> {
    const normalizedFilters = normalizeProductFilters(filters);

    const query = buildQueryParams({
      search: normalizedFilters.search,
      categoryGroup: normalizedFilters.categoryGroup,
      category: normalizedFilters.category,
      brand: normalizedFilters.brand,
      active: normalizedFilters.active,
      minPrice: normalizedFilters.minPrice,
      maxPrice: normalizedFilters.maxPrice,
      available: normalizedFilters.available,
      sort: normalizedFilters.sort,
    });

    return apiFetch<ProductResponse[]>(`/products/admin${query}`, {
      method: "GET",
    });
  },

  async findById(id: number): Promise<ProductResponse> {
    return apiFetch<ProductResponse>(`/products/${id}`, {
      method: "GET",
      auth: false,
    });
  },

  async findByIdForAdmin(id: number): Promise<ProductResponse> {
    return apiFetch<ProductResponse>(`/products/admin/${id}`, {
      method: "GET",
    });
  },

  async findRelated(id: number): Promise<ProductResponse[]> {
    return apiFetch<ProductResponse[]>(`/products/${id}/related`, {
      method: "GET",
      auth: false,
    });
  },

  async findCategories(): Promise<string[]> {
    return apiFetch<string[]>("/products/categories", {
      method: "GET",
      auth: false,
    });
  },

  async findAllCategoriesForAdmin(): Promise<string[]> {
    return apiFetch<string[]>("/products/admin/categories", {
      method: "GET",
    });
  },

  async findBrands(): Promise<string[]> {
    return apiFetch<string[]>("/products/brands", {
      method: "GET",
      auth: false,
    });
  },

  async create(request: CreateProductRequest): Promise<ProductResponse> {
    return apiFetch<ProductResponse>("/products", {
      method: "POST",
      body: request,
    });
  },

  async update(
    id: number,
    request: UpdateProductRequest
  ): Promise<ProductResponse> {
    return apiFetch<ProductResponse>(`/products/${id}`, {
      method: "PUT",
      body: request,
    });
  },

  async activate(id: number): Promise<ProductResponse> {
    return apiFetch<ProductResponse>(`/products/${id}/activate`, {
      method: "PATCH",
    });
  },

  async deactivate(id: number): Promise<ProductResponse> {
    return apiFetch<ProductResponse>(`/products/${id}/deactivate`, {
      method: "PATCH",
    });
  },

  async delete(id: number): Promise<void> {
    return apiFetch<void>(`/products/${id}`, {
      method: "DELETE",
    });
  },

  async findCategoryGroups(): Promise<string[]> {
    return apiFetch<string[]>("/products/category-groups", {
      method: "GET",
      auth: false,
    });
  },

  async findAllCategoryGroupsForAdmin(): Promise<string[]> {
    return apiFetch<string[]>("/products/admin/category-groups", {
      method: "GET",
    });
  },
};