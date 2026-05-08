"use client";

import { useEffect } from "react";
import { CheckCircle2, Package, X } from "lucide-react";
import { buildPublicFileUrl } from "@/services/api";
import { useCart } from "@/contexts/CartContext";

const AUTO_CLOSE_DELAY_MS = 4200;

export function CartToast() {
  const { cartToast, hideCartToast } = useCart();

  const imageUrl = buildPublicFileUrl(cartToast.productImageUrl) ?? "";
  const showQuantity = cartToast.quantity > 1;

  useEffect(() => {
    if (!cartToast.visible) return;

    const timeoutId = window.setTimeout(() => {
      hideCartToast();
    }, AUTO_CLOSE_DELAY_MS);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [cartToast.visible, cartToast.productName, hideCartToast]);

  if (!cartToast.visible) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-x-4 bottom-4 z-[80] mx-auto w-[min(440px,calc(100vw-2rem))] pc-animate-toast-in md:inset-x-auto md:right-6 md:top-24 md:bottom-auto md:mx-0"
    >
      <div className="rounded-[1.55rem] bg-gradient-to-br from-[rgba(176,141,68,0.55)] via-[rgba(222,215,202,0.85)] to-[rgba(255,255,255,0.2)] p-px shadow-[0_24px_70px_rgba(46,39,31,0.16)]">
        <div className="overflow-hidden rounded-[1.5rem] bg-[rgba(255,255,255,0.96)] backdrop-blur-xl">
          <div className="flex items-start gap-4 p-4">
            <div className="relative shrink-0">
              <div className="flex h-[82px] w-[82px] items-end justify-center overflow-hidden rounded-[1.15rem] bg-[#f1ede4] p-2.5 ring-1 ring-[rgba(201,190,172,0.55)]">
                {imageUrl ? (
                  <img
                    src={imageUrl}
                    alt={cartToast.productName}
                    className="h-full w-full object-contain object-bottom"
                  />
                ) : (
                  <Package
                    className="mb-3 h-8 w-8 text-[var(--pc-text-muted)]"
                    aria-hidden="true"
                  />
                )}
              </div>

              <span className="absolute -bottom-2 -right-2 flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-[var(--pc-green)] text-white shadow-[0_8px_18px_rgba(15,118,110,0.22)]">
                <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
              </span>
            </div>

            <div className="min-w-0 flex-1 pt-0.5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#8f6f2e]">
                    Carrinho atualizado
                  </p>

                  <h3 className="mt-2 line-clamp-2 text-[15px] font-semibold leading-5 text-[var(--pc-text)]">
                    {cartToast.productName}
                  </h3>

                  <p className="mt-2 text-sm leading-5 text-[var(--pc-text-muted)]">
                    Produto adicionado
                    {showQuantity && (
                      <>
                        {" "}
                        <span className="text-[var(--pc-text-subtle)]">·</span>{" "}
                        <span className="font-semibold text-[var(--pc-text-soft)]">
                          {cartToast.quantity} unidades
                        </span>
                      </>
                    )}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={hideCartToast}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[var(--pc-text-muted)] transition hover:bg-[#f1ede4] hover:text-[var(--pc-text)]"
                  aria-label="Fechar aviso"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            </div>
          </div>

          <div className="mx-4 mb-3 h-px bg-gradient-to-r from-transparent via-[rgba(176,141,68,0.45)] to-transparent" />
        </div>
      </div>
    </div>
  );
}