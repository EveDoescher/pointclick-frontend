export type PaymentMethod = "PIX" | "CREDIT_CARD" | "DEBIT_CARD" | "BANK_SLIP";

export type PaymentStatus = "PENDING" | "APPROVED" | "FAILED" | "CANCELLED";

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  PIX: "Pix",
  CREDIT_CARD: "Cartão de crédito",
  DEBIT_CARD: "Cartão de débito",
  BANK_SLIP: "Boleto bancário",
};

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  PENDING: "Aguardando confirmação",
  APPROVED: "Aprovado",
  FAILED: "Falhou",
  CANCELLED: "Cancelado",
};

export type CreatePaymentRequest = {
  paymentMethod: PaymentMethod;
  cardNumber?: string | null;
  cardHolderName?: string | null;
  expirationDate?: string | null;
  cvv?: string | null;
  installments?: number | null;
  notes?: string | null;
};

export type PaymentResponse = {
  id: number;
  orderId: number;
  method: PaymentMethod;
  status: PaymentStatus;
  amount: number;
  installments: number | null;
  cardLastFourDigits: string | null;
  pixCode: string | null;
  pixQrCodeBase64: string | null;
  pixConfirmationUrl: string | null;
  bankSlipBarCode: string | null;
  bankSlipBarCodeBase64: string | null;
  bankSlipConfirmationUrl: string | null;
  digitableLine: string | null;
  notes: string | null;
  createdAt: string;
  confirmedAt: string | null;
  cancelledAt: string | null;
};