import type {
  AddOrderItemRequest,
  AdminOrderSummaryResponse,
  ApplyCouponRequest,
  CreateOrderRequest,
  OrderResponse,
  OrderStatus,
  OrderStatusSummaryResponse,
  OrderSummaryResponse,
  UpdateOrderItemRequest,
} from "@/types/order";
import { apiFetch, buildQueryParams } from "./api";

export const orderService = {
  async create(request: CreateOrderRequest): Promise<OrderResponse> {
    return apiFetch<OrderResponse>("/orders", {
      method: "POST",
      body: request,
    });
  },

  async findCurrentCart(): Promise<OrderResponse | null> {
    try {
      return await apiFetch<OrderResponse>("/orders/current", {
        method: "GET",
      });
    } catch (error) {
      if (
        error instanceof Error &&
        "status" in error &&
        (error as { status?: number }).status === 204
      ) {
        return null;
      }

      throw error;
    }
  },

  async findMyOrders(): Promise<OrderSummaryResponse[]> {
    return apiFetch<OrderSummaryResponse[]>("/orders/my", {
      method: "GET",
    });
  },

  async findAllForAdmin(
    status?: OrderStatus | null
  ): Promise<AdminOrderSummaryResponse[]> {
    const query = buildQueryParams({
      status,
    });

    return apiFetch<AdminOrderSummaryResponse[]>(`/orders${query}`, {
      method: "GET",
    });
  },

  async getStatusSummary(): Promise<OrderStatusSummaryResponse> {
    return apiFetch<OrderStatusSummaryResponse>("/orders/summary", {
      method: "GET",
    });
  },

  async findById(orderId: number): Promise<OrderResponse> {
    return apiFetch<OrderResponse>(`/orders/${orderId}`, {
      method: "GET",
    });
  },

  async findByIdForAdmin(orderId: number): Promise<OrderResponse> {
    return apiFetch<OrderResponse>(`/orders/admin/${orderId}`, {
      method: "GET",
    });
  },

  async addItem(
    orderId: number,
    request: AddOrderItemRequest
  ): Promise<OrderResponse> {
    return apiFetch<OrderResponse>(`/orders/${orderId}/items`, {
      method: "POST",
      body: request,
    });
  },

  async updateItem(
    orderId: number,
    itemId: number,
    request: UpdateOrderItemRequest
  ): Promise<OrderResponse> {
    return apiFetch<OrderResponse>(`/orders/${orderId}/items/${itemId}`, {
      method: "PUT",
      body: request,
    });
  },

  async removeItem(orderId: number, itemId: number): Promise<OrderResponse> {
    return apiFetch<OrderResponse>(`/orders/${orderId}/items/${itemId}`, {
      method: "DELETE",
    });
  },

  async applyCoupon(
    orderId: number,
    request: ApplyCouponRequest
  ): Promise<OrderResponse> {
    return apiFetch<OrderResponse>(`/orders/${orderId}/coupon`, {
      method: "POST",
      body: request,
    });
  },

  async removeCoupon(orderId: number): Promise<OrderResponse> {
    return apiFetch<OrderResponse>(`/orders/${orderId}/coupon`, {
      method: "DELETE",
    });
  },

  async close(orderId: number): Promise<OrderResponse> {
    return apiFetch<OrderResponse>(`/orders/${orderId}/close`, {
      method: "POST",
    });
  },

  async ship(orderId: number): Promise<OrderResponse> {
    return apiFetch<OrderResponse>(`/orders/${orderId}/ship`, {
      method: "POST",
    });
  },

  async deliver(orderId: number): Promise<OrderResponse> {
    return apiFetch<OrderResponse>(`/orders/${orderId}/deliver`, {
      method: "POST",
    });
  },

  async confirmDelivery(orderId: number): Promise<OrderResponse> {
    return apiFetch<OrderResponse>(`/orders/${orderId}/confirm-delivery`, {
      method: "POST",
    });
  },

  async finish(orderId: number): Promise<OrderResponse> {
    return apiFetch<OrderResponse>(`/orders/${orderId}/finish`, {
      method: "POST",
    });
  },

  async cancel(orderId: number): Promise<OrderResponse> {
    return apiFetch<OrderResponse>(`/orders/${orderId}/cancel`, {
      method: "POST",
    });
  },

  async reopenExpired(orderId: number): Promise<OrderResponse> {
    return apiFetch<OrderResponse>(`/orders/${orderId}/reopen-expired`, {
      method: "POST",
    });
  },
};