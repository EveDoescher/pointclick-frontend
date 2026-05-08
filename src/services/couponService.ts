import type { CouponResponse, CreateCouponRequest } from "@/types/coupon";
import { apiFetch, buildQueryParams } from "./api";

export const couponService = {
  async create(request: CreateCouponRequest): Promise<CouponResponse> {
    return apiFetch<CouponResponse>("/coupons", {
      method: "POST",
      body: request,
    });
  },

  async findAll(active?: boolean | null): Promise<CouponResponse[]> {
    const query = buildQueryParams({
      active,
    });

    return apiFetch<CouponResponse[]>(`/coupons${query}`, {
      method: "GET",
    });
  },

  async findById(id: number): Promise<CouponResponse> {
    return apiFetch<CouponResponse>(`/coupons/${id}`, {
      method: "GET",
    });
  },

  async update(
    id: number,
    request: CreateCouponRequest
  ): Promise<CouponResponse> {
    return apiFetch<CouponResponse>(`/coupons/${id}`, {
      method: "PUT",
      body: request,
    });
  },

  async deactivate(id: number): Promise<CouponResponse> {
    return apiFetch<CouponResponse>(`/coupons/${id}/deactivate`, {
      method: "PATCH",
    });
  },

  async activate(id: number): Promise<CouponResponse> {
    return apiFetch<CouponResponse>(`/coupons/${id}/activate`, {
      method: "PATCH",
    });
  },
};