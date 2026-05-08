import type { OrderResponse, OrderSummaryResponse } from "@/types/order";

export const orderFixture: OrderResponse = {
  id: 10,
  userId: 1,
  userFullName: "Cliente PointClick",
  orderDate: "2026-05-01T10:00:00Z",
  itemsAmount: 4999.9,
  discountAmount: 0,
  freightAmount: 29.9,
  totalAmount: 5029.8,
  couponCode: null,
  status: "PENDING",
  paymentMethod: null,
  deliveryAddress: null,
  notes: null,
  closedAt: null,
  paidAt: null,
  shippedAt: null,
  deliveredAt: null,
  finishedAt: null,
  cancelledAt: null,
  reservationExpiresAt: null,
  items: [
    {
      id: 100,
      productId: 1,
      productName: "Notebook PointClick Pro",
      productBrand: "PointClick",
      productCategory: "Notebook",
      productImageUrl: "/uploads/products/notebook.png",
      quantity: 1,
      unitPriceAtMoment: 4999.9,
      subtotal: 4999.9,
      createdAt: "2026-05-01T10:00:00Z",
      updatedAt: "2026-05-01T10:00:00Z",
    },
  ],
  createdAt: "2026-05-01T10:00:00Z",
  updatedAt: "2026-05-01T10:00:00Z",
};

export const orderSummaryFixture: OrderSummaryResponse = {
  id: 10,
  orderDate: "2026-05-01T10:00:00Z",
  itemsAmount: 4999.9,
  discountAmount: 0,
  freightAmount: 29.9,
  totalAmount: 5029.8,
  couponCode: null,
  status: "PENDING",
  paymentMethod: null,
  createdAt: "2026-05-01T10:00:00Z",
};

export function makeOrderFixture(
  overrides: Partial<OrderResponse> = {}
): OrderResponse {
  return {
    ...orderFixture,
    ...overrides,
  };
}
