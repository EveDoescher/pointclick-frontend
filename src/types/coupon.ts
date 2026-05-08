export type DiscountType = "PERCENTAGE" | "FIXED_AMOUNT";

export type CreateCouponRequest = {
  code: string;
  description: string | null;
  discountType: DiscountType;
  discountValue: number;
  minimumOrderValue: number | null;
  active: boolean;
  startsAt: string | null;
  endsAt: string | null;
  usageLimit: number | null;
};

export type CouponResponse = {
  id: number;
  code: string;
  description: string | null;
  discountType: DiscountType;
  discountValue: number;
  minimumOrderValue: number;
  active: boolean;
  startsAt: string | null;
  endsAt: string | null;
  usageLimit: number | null;
  usedCount: number;
  currentlyValid: boolean;
  createdAt: string;
  updatedAt: string;
};

export const DISCOUNT_TYPE_LABELS: Record<DiscountType, string> = {
  PERCENTAGE: "Percentual",
  FIXED_AMOUNT: "Valor fixo",
};