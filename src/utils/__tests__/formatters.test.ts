import { describe, expect, it } from "vitest";
import {
  formatCep,
  formatCpf,
  formatCurrency,
  formatDate,
  formatDateTime,
  formatPhone,
  getInitials,
  normalizeNullableText,
  onlyDigits,
  pluralize,
} from "../formatters";

describe("formatters", () => {
  it("formata moeda em BRL", () => {
    expect(formatCurrency(1234.5)).toBe("R$ 1.234,50");
  });

  it("usa zero para moeda inválida", () => {
    expect(formatCurrency(Number.NaN)).toBe("R$ 0,00");
    expect(formatCurrency(null)).toBe("R$ 0,00");
  });

  it("formata data e data/hora válidas", () => {
    expect(formatDate("2026-05-01T10:30:00Z")).not.toBe("-");
    expect(formatDateTime("2026-05-01T10:30:00Z")).not.toBe("-");
  });

  it("retorna hífen para datas ausentes ou inválidas", () => {
    expect(formatDate(null)).toBe("-");
    expect(formatDateTime("data-invalida")).toBe("-");
  });

  it("formata CEP", () => {
    expect(formatCep("13480000")).toBe("13480-000");
    expect(formatCep("13480")).toBe("13480");
    expect(formatCep(null)).toBe("");
  });

  it("formata CPF progressivamente", () => {
    expect(formatCpf("123")).toBe("123");
    expect(formatCpf("123456")).toBe("123.456");
    expect(formatCpf("123456789")).toBe("123.456.789");
    expect(formatCpf("12345678909")).toBe("123.456.789-09");
  });

  it("formata telefone fixo/celular", () => {
    expect(formatPhone("19999999999")).toBe("(19) 99999-9999");
    expect(formatPhone("1933334444")).toBe("(19) 3333-4444");
  });

  it("mantém somente dígitos", () => {
    expect(onlyDigits("(19) 99999-9999")).toBe("19999999999");
  });

  it("normaliza texto opcional", () => {
    expect(normalizeNullableText("  teste  ")).toBe("teste");
    expect(normalizeNullableText("   ")).toBeNull();
  });

  it("gera iniciais", () => {
    expect(getInitials("Evelynn Doescher")).toBe("ED");
    expect(getInitials("PointClick")).toBe("PO");
    expect(getInitials("")).toBe("PC");
  });

  it("pluraliza termos", () => {
    expect(pluralize(1, "produto", "produtos")).toBe("produto");
    expect(pluralize(2, "produto", "produtos")).toBe("produtos");
  });
});
