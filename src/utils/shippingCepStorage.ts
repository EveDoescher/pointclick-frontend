export const SHIPPING_CEP_STORAGE_KEY = "pointclick_shipping_cep";

export function sanitizeCep(value: string | null | undefined): string {
  return value?.replace(/\D/g, "").slice(0, 8) ?? "";
}

export function formatCepInput(value: string): string {
  const digits = sanitizeCep(value);

  if (digits.length <= 5) {
    return digits;
  }

  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
}

export function getStoredShippingCep(): string {
  if (typeof window === "undefined") return "";

  try {
    return sanitizeCep(sessionStorage.getItem(SHIPPING_CEP_STORAGE_KEY));
  } catch {
    return "";
  }
}

export function saveStoredShippingCep(cep: string): void {
  if (typeof window === "undefined") return;

  const sanitizedCep = sanitizeCep(cep);

  if (sanitizedCep.length !== 8) return;

  try {
    sessionStorage.setItem(SHIPPING_CEP_STORAGE_KEY, sanitizedCep);
  } catch {
    // Não bloqueia o fluxo caso o navegador negue acesso ao sessionStorage.
  }
}
