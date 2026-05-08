import type { ShippingQuoteResponse } from "@/types/order";
import type { CepAddressResponse } from "@/types/user";
import { apiFetch, buildQueryParams } from "./api";

function normalizeCep(cep: string): string {
  return cep.replace(/\D/g, "");
}

export const addressService = {
  async findAddressByCep(cep: string): Promise<CepAddressResponse> {
    const normalizedCep = normalizeCep(cep);

    return apiFetch<CepAddressResponse>(`/shipping/cep/${normalizedCep}`, {
      method: "GET",
      auth: false,
    });
  },

  async quoteByCep(cep: string): Promise<ShippingQuoteResponse> {
    const query = buildQueryParams({
      cep: normalizeCep(cep),
    });

    return apiFetch<ShippingQuoteResponse>(`/shipping/quote${query}`, {
      method: "GET",
      auth: false,
    });
  },
};