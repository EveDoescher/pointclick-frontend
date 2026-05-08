import type {
  CreatePaymentRequest,
  PaymentResponse,
} from "@/types/payment";
import { apiFetch } from "./api";

export const paymentService = {
  async createPayment(
    orderId: number,
    request: CreatePaymentRequest
  ): Promise<PaymentResponse> {
    return apiFetch<PaymentResponse>(`/payments/orders/${orderId}`, {
      method: "POST",
      body: request,
    });
  },

  async findByOrderId(orderId: number): Promise<PaymentResponse> {
    return apiFetch<PaymentResponse>(`/payments/orders/${orderId}`, {
      method: "GET",
    });
  },

  async cancelPayment(paymentId: number): Promise<PaymentResponse> {
    return apiFetch<PaymentResponse>(`/payments/${paymentId}/cancel`, {
      method: "POST",
    });
  },

  async confirmPixPayment(
    paymentId: number,
    token: string
  ): Promise<PaymentResponse> {
    const encodedToken = encodeURIComponent(token);

    return apiFetch<PaymentResponse>(
      `/payments/${paymentId}/confirm-pix?token=${encodedToken}`,
      {
        method: "POST",
        auth: false,
      }
    );
  },

  async confirmBankSlipPayment(
    paymentId: number,
    token: string
  ): Promise<PaymentResponse> {
    const encodedToken = encodeURIComponent(token);

    return apiFetch<PaymentResponse>(
      `/payments/${paymentId}/confirm-bank-slip?token=${encodedToken}`,
      {
        method: "POST",
        auth: false,
      }
    );
  },
};