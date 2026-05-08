export type NotificationType =
  | "PAYMENT_APPROVED"
  | "ORDER_SHIPPED"
  | "ORDER_DELIVERED"
  | "ORDER_FINISHED"
  | "ORDER_CANCELLED"
  | "FAVORITE_PRODUCT_PROMOTION"
  | "FAVORITE_PRODUCT_BACK_IN_STOCK";

export type NotificationResponse = {
  id: number;
  type: NotificationType;
  title: string;
  message: string;
  linkUrl: string | null;
  read: boolean;
  readAt: string | null;
  createdAt: string;
};

export const NOTIFICATION_TYPE_LABELS: Record<NotificationType, string> = {
  PAYMENT_APPROVED: "Pagamento aprovado",
  ORDER_SHIPPED: "Pedido enviado",
  ORDER_DELIVERED: "Pedido entregue",
  ORDER_FINISHED: "Compra finalizada",
  ORDER_CANCELLED: "Pedido cancelado",
  FAVORITE_PRODUCT_PROMOTION: "Promoção",
  FAVORITE_PRODUCT_BACK_IN_STOCK: "Voltou ao estoque",
};