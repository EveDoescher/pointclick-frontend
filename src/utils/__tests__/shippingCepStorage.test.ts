import { describe, expect, it } from "vitest";
import {
  SHIPPING_CEP_STORAGE_KEY,
  formatCepInput,
  getStoredShippingCep,
  sanitizeCep,
  saveStoredShippingCep,
} from "../shippingCepStorage";

describe("shippingCepStorage", () => {
  it("sanitiza CEP mantendo no máximo 8 dígitos", () => {
    expect(sanitizeCep("13480-000")).toBe("13480000");
    expect(sanitizeCep("13480000123")).toBe("13480000");
    expect(sanitizeCep(null)).toBe("");
  });

  it("formata entrada de CEP", () => {
    expect(formatCepInput("1348")).toBe("1348");
    expect(formatCepInput("13480000")).toBe("13480-000");
  });

  it("salva e recupera CEP válido do sessionStorage", () => {
    saveStoredShippingCep("13480-000");

    expect(sessionStorage.getItem(SHIPPING_CEP_STORAGE_KEY)).toBe("13480000");
    expect(getStoredShippingCep()).toBe("13480000");
  });

  it("não salva CEP inválido", () => {
    saveStoredShippingCep("123");

    expect(sessionStorage.getItem(SHIPPING_CEP_STORAGE_KEY)).toBeNull();
  });
});
