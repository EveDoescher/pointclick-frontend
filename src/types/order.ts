import type { PaymentMethod } from "./payment";

export type OrderStatus =
  | "PENDING"
  | "CLOSED"
  | "PAID"
  | "SHIPPED"
  | "DELIVERED"
  | "FINISHED"
  | "CANCELLED";

export type CreateOrderRequest = {
  userId: number;
};

export type AddOrderItemRequest = {
  productId: number;
  quantity: number;
};

export type UpdateOrderItemRequest = {
  quantity: number;
};

export type ShippingQuoteRequest = {
  cep: string;
};

export type ApplyCouponRequest = {
  code: string;
};

export type OrderItemResponse = {
  id: number;
  productId: number;
  productName: string;
  productBrand: string;
  productCategory: string;
  productImageUrl: string | null;
  quantity: number;
  unitPriceAtMoment: number;
  subtotal: number;
  createdAt: string;
  updatedAt: string;
};

export type OrderResponse = {
  id: number;
  userId: number;
  userFullName: string;
  orderDate: string;
  itemsAmount: number;
  discountAmount: number;
  freightAmount: number;
  totalAmount: number;
  couponCode: string | null;
  status: OrderStatus;
  paymentMethod: PaymentMethod | null;
  deliveryAddress: string | null;
  notes: string | null;
  closedAt: string | null;
  paidAt: string | null;
  shippedAt: string | null;
  deliveredAt: string | null;
  finishedAt: string | null;
  cancelledAt: string | null;
  reservationExpiresAt: string | null;
  items: OrderItemResponse[];
  createdAt: string;
  updatedAt: string;
};

export type OrderSummaryResponse = {
  id: number;
  orderDate: string;
  itemsAmount: number;
  discountAmount: number;
  freightAmount: number;
  totalAmount: number;
  couponCode: string | null;
  status: OrderStatus;
  paymentMethod: PaymentMethod | null;
  createdAt: string;
};

export type AdminOrderSummaryResponse = {
  id: number;
  customerId: number;
  customerName: string;
  customerEmail: string;
  status: OrderStatus;
  itemsAmount: number;
  discountAmount: number;
  freightAmount: number;
  totalAmount: number;
  couponCode: string | null;
  paymentMethod: PaymentMethod | null;
  paidAt: string | null;
  shippedAt: string | null;
  deliveredAt: string | null;
  finishedAt: string | null;
  createdAt: string;
};

export type OrderStatusSummaryResponse = {
  pending: number;
  closed: number;
  paid: number;
  shipped: number;
  delivered: number;
  finished: number;
  cancelled: number;
};

export type ShippingQuoteResponse = {
  cep: string;
  shippingPrice: number;
  estimatedDays: number;
  street: string | null;
  district: string | null;
  city: string | null;
  state: string | null;
};

export type OrderStatusLabelMap = Record<OrderStatus, string>;

export const ORDER_STATUS_LABELS: OrderStatusLabelMap = {
  PENDING: "Carrinho aberto",
  CLOSED: "Aguardando pagamento",
  PAID: "Pagamento aprovado",
  SHIPPED: "A caminho",
  DELIVERED: "Entregue",
  FINISHED: "Finalizado",
  CANCELLED: "Cancelado",
};

export const ORDER_STATUS_DESCRIPTIONS: OrderStatusLabelMap = {
  PENDING: "Seu carrinho ainda pode ser alterado.",
  CLOSED: "Seu pedido foi fechado e está aguardando pagamento.",
  PAID: "O pagamento foi aprovado e o pedido aguarda envio.",
  SHIPPED: "Seu pedido foi enviado e está a caminho.",
  DELIVERED: "A loja marcou o pedido como entregue. Confirme o recebimento se estiver tudo certo.",
  FINISHED: "Compra finalizada após confirmação de recebimento.",
  CANCELLED: "Este pedido foi cancelado.",
};