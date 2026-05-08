"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Laptop, Loader2, MapPin, ShoppingCart, X } from "lucide-react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { buildPublicFileUrl } from "@/services/api";
import { addressService } from "@/services/addressService";
import { userService } from "@/services/userService";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { useFeedbackModal } from "@/contexts/FeedbackModalContext";
import { formatCep, formatCurrency, onlyDigits } from "@/utils/formatters";
import {
  getStoredShippingCep,
  sanitizeCep,
  saveStoredShippingCep,
} from "@/utils/shippingCepStorage";

type AddressForm = {
  cep: string;
  street: string;
  number: string;
  complement: string;
  city: string;
  state: string;
};

const EMPTY_ADDRESS_FORM: AddressForm = {
  cep: "",
  street: "",
  number: "",
  complement: "",
  city: "",
  state: "",
};

export default function CartPage() {
  return (
    <ProtectedRoute>
      <CartContent />
    </ProtectedRoute>
  );
}

function CartContent() {
  const router = useRouter();
  const { profile, refreshProfile } = useAuth();
  const {
    cart,
    cartItems,
    cartCount,
    cartSubtotal,
    cartTotal,
    loading,
    actionLoading,
    incrementItem,
    decrementItem,
    removeItem,
    applyCoupon,
    removeCoupon,
    quoteShippingByCep,
    closeCart,
  } = useCart();

  const { showError, showSuccess, showWarning } = useFeedbackModal();

  const [cep, setCep] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [shippingLoading, setShippingLoading] = useState(false);
  const [shippingError, setShippingError] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState("");
  const [couponSuccess, setCouponSuccess] = useState("");
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [addressModalOpen, setAddressModalOpen] = useState(false);
  const [addressLoading, setAddressLoading] = useState(false);
  const [cepLoading, setCepLoading] = useState(false);
  const [addressCepError, setAddressCepError] = useState("");
  const [addressForm, setAddressForm] =
    useState<AddressForm>(EMPTY_ADDRESS_FORM);
  const [shippingQuote, setShippingQuote] = useState<{
    shippingPrice: number;
    estimatedDays: number;
    city: string | null;
    state: string | null;
    street: string | null;
  } | null>(null);

  const autoQuotedCepRef = useRef<string | null>(null);

  useEffect(() => {
    const profileCep = sanitizeCep(profile?.address?.cep);

    if (profileCep.length === 8) {
      setCep(formatCep(profileCep));
      return;
    }

    const storedCep = getStoredShippingCep();

    if (storedCep.length === 8) {
      setCep(formatCep(storedCep));
    }
  }, [profile?.address?.cep]);

  useEffect(() => {
    if (profile?.address) {
      setAddressForm({
        cep: formatCep(profile.address.cep),
        street: profile.address.street ?? "",
        number: profile.address.number ?? "",
        complement: profile.address.complement ?? "",
        city: profile.address.city ?? "",
        state: profile.address.state ?? "",
      });
      return;
    }

    const storedCep = getStoredShippingCep();

    setAddressForm({
      ...EMPTY_ADDRESS_FORM,
      cep: storedCep.length === 8 ? formatCep(storedCep) : "",
    });
  }, [
    profile?.address?.cep,
    profile?.address?.street,
    profile?.address?.number,
    profile?.address?.complement,
    profile?.address?.city,
    profile?.address?.state,
  ]);

  function openAddressModal() {
    const profileCep = sanitizeCep(profile?.address?.cep);
    const storedCep = getStoredShippingCep();
    const fallbackCep = profileCep.length === 8 ? profileCep : storedCep;
    const currentCep = sanitizeCep(addressForm.cep);
    const cepToUse = currentCep.length === 8 ? currentCep : fallbackCep;
    const shouldAutoFillAddress =
      cepToUse.length === 8 &&
      !profile?.address &&
      (!addressForm.street || !addressForm.city || !addressForm.state);

    setAddressForm((current) => ({
      ...current,
      cep: cepToUse.length === 8 ? formatCep(cepToUse) : current.cep,
    }));
    setAddressCepError("");
    setAddressModalOpen(true);

    if (shouldAutoFillAddress) {
      void fillAddressFromCep(cepToUse, { silent: true });
    }
  }

  async function fillAddressFromCep(
    normalizedCep: string,
    options?: { silent?: boolean },
  ) {
    if (normalizedCep.length !== 8) {
      if (!options?.silent) {
        setAddressCepError("Informe um CEP válido com 8 dígitos.");
      }
      return;
    }

    setCepLoading(true);
    setAddressCepError("");

    try {
      const response = await addressService.findAddressByCep(normalizedCep);

      setAddressForm((current) => ({
        ...current,
        cep: formatCep(response.cep ?? normalizedCep),
        street: response.street ?? current.street,
        city: response.city ?? current.city,
        state: response.state ?? current.state,
      }));
    } catch (error) {
      setAddressCepError(getCepErrorMessage(error));
    } finally {
      setCepLoading(false);
    }
  }

  async function handleAddressCepBlur() {
    const normalizedCep = onlyDigits(addressForm.cep);

    await fillAddressFromCep(normalizedCep);
  }

  async function handleAddressSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const normalizedCep = onlyDigits(addressForm.cep);

    if (normalizedCep.length !== 8) {
      showWarning("Informe um CEP válido com 8 dígitos.");
      return;
    }

    setAddressLoading(true);

    try {
      await userService.updateMyAddress({
        cep: normalizedCep,
        street: addressForm.street,
        number: addressForm.number,
        complement: addressForm.complement.trim() || null,
        city: addressForm.city,
        state: addressForm.state,
      });

      const updatedProfile = await refreshProfile();

      setCep(formatCep(normalizedCep));
      saveStoredShippingCep(normalizedCep);
      setAddressModalOpen(false);
      showSuccess("Endereço cadastrado. Você já pode finalizar a compra.");

      if (updatedProfile?.profileCompleteForCheckout) {
        try {
          const response = await quoteShippingByCep(normalizedCep);
          setShippingQuote(response);
          autoQuotedCepRef.current = normalizedCep;
        } catch {
          autoQuotedCepRef.current = null;
        }
      }
    } catch (error) {
      showError(error, "Erro ao salvar endereço");
    } finally {
      setAddressLoading(false);
    }
  }

  async function handleQuoteShipping(options?: { silent?: boolean }) {
    const normalizedCep = sanitizeCep(cep);

    if (normalizedCep.length !== 8) {
      setShippingQuote(null);
      setShippingError("Informe um CEP válido com 8 dígitos.");

      if (!options?.silent) {
        showWarning("Informe um CEP válido com 8 dígitos.");
      }

      return;
    }

    setShippingLoading(true);
    setShippingError("");
    setShippingQuote(null);

    try {
      const response = await quoteShippingByCep(normalizedCep);
      setShippingQuote(response);
      saveStoredShippingCep(normalizedCep);
      autoQuotedCepRef.current = normalizedCep;
    } catch (error) {
      setShippingQuote(null);
      setShippingError(getCepErrorMessage(error));
      autoQuotedCepRef.current = normalizedCep;
    } finally {
      setShippingLoading(false);
    }
  }

  useEffect(() => {
    const normalizedCep = sanitizeCep(cep);

    if (
      loading ||
      shippingLoading ||
      cartItems.length === 0 ||
      normalizedCep.length !== 8 ||
      autoQuotedCepRef.current === normalizedCep
    ) {
      return;
    }

    void handleQuoteShipping({ silent: true });
  }, [cep, cartItems.length, loading, shippingLoading]);

  async function handleApplyCoupon() {
    if (!cart) {
      setCouponSuccess("");
      setCouponError("Carrinho não encontrado.");
      return;
    }

    if (!couponCode.trim()) {
      setCouponSuccess("");
      setCouponError("Informe o código do cupom.");
      return;
    }

    setCouponLoading(true);
    setCouponError("");
    setCouponSuccess("");

    try {
      await applyCoupon(couponCode.trim().toUpperCase());
      setCouponCode("");
      setCouponSuccess(
        "Cupom aplicado. O desconto já foi atualizado no resumo.",
      );
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Cupom inválido, expirado ou indisponível.";

      setCouponError(message);
    } finally {
      setCouponLoading(false);
    }
  }

  async function handleRemoveCoupon() {
    setCouponLoading(true);
    setCouponError("");
    setCouponSuccess("");

    try {
      await removeCoupon();
      setCouponSuccess("Cupom removido.");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Não foi possível remover o cupom.";

      setCouponError(message);
    } finally {
      setCouponLoading(false);
    }
  }

  async function handleCheckout() {
    if (!cart || cart.items.length === 0) {
      showWarning(
        "Adicione pelo menos um produto ao carrinho antes de finalizar.",
      );
      return;
    }

    const updatedProfile = await refreshProfile();

    if (!updatedProfile?.profileCompleteForCheckout) {
      openAddressModal();
      return;
    }

    setCheckoutLoading(true);

    try {
      const closedOrder = await closeCart();

      router.push(`/pagamento/${closedOrder.id}`);
    } catch (error) {
      showError(error, "Erro ao fechar pedido");
    } finally {
      setCheckoutLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFAF9] px-4 py-12 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-[2rem] border border-stone-200 bg-white p-8 shadow-sm">
            <div className="h-8 w-64 animate-pulse rounded bg-stone-200/90" />
            <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_380px]">
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div
                    key={index}
                    className="h-32 animate-pulse rounded-[2rem] bg-stone-200/90"
                  />
                ))}
              </div>
              <div className="h-96 animate-pulse rounded-[2rem] bg-stone-200/90" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!cart || cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-[#FAFAF9] px-4 py-12 lg:px-8">
        <div className="mx-auto max-w-3xl rounded-[2rem] border border-stone-200 bg-white p-10 text-center shadow-[0_18px_34px_rgba(28,25,23,0.06)]">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[2rem] bg-[#F7F3EC] text-stone-500">
            <ShoppingCart className="h-9 w-9" aria-hidden="true" />
          </div>

          <h1 className="mt-7 font-[family-name:var(--font-rubik)] text-3xl font-semibold text-stone-900">
            Seu carrinho está vazio
          </h1>

          <p className="mt-3 text-stone-600">
            Explore a vitrine e adicione produtos para começar seu pedido.
          </p>

          <Link
            href="/produtos"
            className="mt-8 inline-flex rounded-full border border-[var(--pc-purple)] bg-[var(--pc-purple)] px-6 py-3 text-sm font-semibold !text-white shadow-sm transition hover:bg-[var(--pc-purple-hover)]"
          >
            Ver produtos
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAF9] px-4 py-10 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="border-b border-stone-200 pb-8">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                Checkout
              </p>
              <h1 className="mt-2 font-[family-name:var(--font-rubik)] text-3xl font-semibold tracking-[-0.04em] text-stone-900 sm:text-4xl">
                Carrinho
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-stone-600">
                Itens à esquerda; à direita, resumo, frete por CEP e cupom. Ao
                alterar quantidades o total atualiza sozinho.
              </p>
            </div>
            <div className="text-right text-sm text-stone-600">
              <p className="font-medium text-stone-900">
                {cartCount} {cartCount === 1 ? "item" : "itens"}
              </p>
              <p className="mt-0.5 tabular-nums text-stone-500">
                Subtotal {formatCurrency(cartSubtotal)}
              </p>
            </div>
          </div>
        </header>

        <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_min(100%,380px)]">
          <section className="space-y-4">
            {cartItems.map((item) => {
              const imageUrl = buildPublicFileUrl(item.productImageUrl);

              return (
                <article
                  key={item.id}
                  className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm transition hover:border-stone-300"
                >
                  <div className="grid gap-5 p-5 md:grid-cols-[minmax(0,132px)_1fr_auto] md:items-center">
                    <Link
                      href={`/produtos/${item.productId}`}
                      className="mx-auto flex aspect-square w-full max-w-[132px] items-center justify-center overflow-hidden rounded-lg bg-[#f4f1eb] md:mx-0 md:max-w-none"
                    >
                      {imageUrl ? (
                        <img
                          src={imageUrl}
                          alt={item.productName}
                          className="max-h-full max-w-full object-contain object-center p-2"
                        />
                      ) : (
                        <Laptop
                          className="h-10 w-10 text-stone-400"
                          aria-hidden="true"
                        />
                      )}
                    </Link>

                    <div className="min-w-0">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-500">
                        {item.productBrand} · {item.productCategory}
                      </p>

                      <Link href={`/produtos/${item.productId}`}>
                        <h2 className="mt-2 font-[family-name:var(--font-rubik)] text-lg font-semibold text-stone-900 transition hover:text-[var(--pc-purple)] sm:text-xl">
                          {item.productName}
                        </h2>
                      </Link>

                      <dl className="mt-4 grid gap-1 text-sm text-stone-600 sm:max-w-md">
                        <div className="flex flex-wrap justify-between gap-x-4 gap-y-0.5">
                          <dt>Unitário</dt>
                          <dd className="tabular-nums font-semibold text-stone-900">
                            {formatCurrency(item.unitPriceAtMoment)}
                          </dd>
                        </div>
                        <div className="flex flex-wrap justify-between gap-x-4 gap-y-0.5">
                          <dt>Subtotal</dt>
                          <dd className="tabular-nums font-semibold text-stone-900">
                            {formatCurrency(item.subtotal)}
                          </dd>
                        </div>
                      </dl>
                    </div>

                    <div className="flex flex-col gap-3 md:items-end">
                      <div className="flex items-center rounded-2xl border border-stone-300 bg-white">
                        <button
                          type="button"
                          onClick={() => decrementItem(item)}
                          disabled={actionLoading}
                          className="h-11 w-11 text-xl font-semibold text-stone-800 disabled:opacity-50"
                        >
                          -
                        </button>

                        <span className="flex h-11 w-12 items-center justify-center border-x border-stone-200 text-sm font-semibold">
                          {item.quantity}
                        </span>

                        <button
                          type="button"
                          onClick={() => incrementItem(item)}
                          disabled={actionLoading}
                          className="h-11 w-11 text-xl font-semibold text-stone-800 disabled:opacity-50"
                        >
                          +
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => removeItem(item.id)}
                        disabled={actionLoading}
                        className="rounded-full px-4 py-2.5 text-sm font-semibold text-rose-700 transition hover:bg-rose-50 disabled:opacity-50"
                      >
                        Remover
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </section>

          <aside className="h-fit rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
              Resumo
            </p>

            <h2 className="mt-3 font-[family-name:var(--font-rubik)] text-2xl font-semibold text-stone-900">
              Pedido #{cart.id}
            </h2>

            <div className="mt-6 space-y-3 rounded-[1.5rem] border border-stone-200 bg-stone-50 p-5">
              <SummaryRow label="Itens" value={`${cartCount} produto(s)`} />
              <SummaryRow
                label="Subtotal"
                value={formatCurrency(cartSubtotal)}
              />
              <SummaryRow
                label="Desconto"
                value={`-${formatCurrency(cart.discountAmount ?? 0)}`}
              />
              <SummaryRow
                label="Frete"
                value={
                  shippingLoading
                    ? "Calculando..."
                    : shippingQuote
                      ? formatCurrency(shippingQuote.shippingPrice)
                      : cart.freightAmount > 0
                        ? formatCurrency(cart.freightAmount)
                        : "Informe o CEP"
                }
              />

              <div className="border-t border-stone-200 pt-4">
                <SummaryRow
                  label="Total atual"
                  value={formatCurrency(cartTotal)}
                  strong
                />
              </div>
            </div>

            <div className="mt-6 rounded-[1.5rem] border border-stone-200 p-5">
              <p className="text-sm font-semibold text-stone-900">
                Simular frete
              </p>

              <div className="mt-3 flex gap-2">
                <input
                  value={cep}
                  onChange={(event) => {
                    setCep(formatCep(event.target.value));
                    setShippingQuote(null);
                    setShippingError("");
                    autoQuotedCepRef.current = null;
                  }}
                  placeholder="00000-000"
                  className="min-w-0 flex-1 rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm font-medium outline-none focus:border-[var(--pc-purple)] focus:ring-2 focus:ring-[var(--pc-purple)]/15"
                />

                <button
                  type="button"
                  onClick={() => handleQuoteShipping()}
                  disabled={shippingLoading}
                  className="pc-btn pc-btn-secondary shrink-0 px-4 py-2.5 text-sm disabled:opacity-50"
                >
                  {shippingLoading ? "..." : "Calcular"}
                </button>
              </div>

              {shippingError && (
                <p className="mt-3 text-sm font-medium text-[var(--pc-danger)]">
                  {shippingError}
                </p>
              )}

              {shippingQuote && (
                <div className="mt-4 rounded-lg border border-stone-200 bg-[#fbfaf7] p-4 text-sm text-stone-700">
                  <p className="font-semibold text-stone-900">
                    <span className="tabular-nums">
                      {formatCurrency(shippingQuote.shippingPrice)}
                    </span>
                    <span className="text-stone-500">
                      {" "}
                      · {shippingQuote.estimatedDays} dias úteis
                    </span>
                  </p>
                  <p className="mt-1 text-stone-600">
                    {shippingQuote.city}/{shippingQuote.state}
                  </p>
                </div>
              )}
            </div>

            <div className="mt-6 rounded-[1.5rem] border border-stone-200 p-5">
              <p className="text-sm font-semibold text-stone-900">Cupom</p>

              {cart.couponCode ? (
                <div className="mt-3 rounded-lg border border-stone-200 bg-[#fbfaf7] p-4">
                  <p className="text-sm font-semibold text-stone-900">
                    {cart.couponCode}
                  </p>
                  <p className="mt-1 text-sm text-stone-600">
                    Desconto:{" "}
                    <span className="tabular-nums font-medium text-stone-900">
                      {formatCurrency(cart.discountAmount)}
                    </span>
                  </p>

                  <button
                    type="button"
                    onClick={handleRemoveCoupon}
                    disabled={couponLoading}
                    className="mt-3 text-sm font-semibold text-rose-700 hover:text-rose-800"
                  >
                    Remover cupom
                  </button>
                </div>
              ) : (
                <div className="mt-3 flex gap-2">
                  <input
                    value={couponCode}
                    onChange={(event) => {
                      setCouponCode(event.target.value);
                      setCouponError("");
                      setCouponSuccess("");
                    }}
                    placeholder="POINT10"
                    className="min-w-0 flex-1 rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm font-medium uppercase outline-none focus:border-[var(--pc-purple)] focus:ring-2 focus:ring-[var(--pc-purple)]/15"
                  />

                  <button
                    type="button"
                    onClick={handleApplyCoupon}
                    disabled={couponLoading}
                    className="pc-btn pc-btn-secondary shrink-0 px-4 py-2.5 text-sm disabled:opacity-50"
                  >
                    Aplicar
                  </button>
                </div>
              )}
              {couponError && (
                <p className="mt-2 text-sm font-medium text-[var(--pc-danger)]">
                  {couponError}
                </p>
              )}

              {couponSuccess && (
                <p className="mt-2 text-sm font-medium text-[var(--pc-green)]">
                  {couponSuccess}
                </p>
              )}
            </div>

            {!profile?.profileCompleteForCheckout && (
              <div className="mt-6 rounded-lg border border-stone-200 bg-[#fbfaf7] p-5">
                <p className="text-sm font-semibold text-stone-900">
                  Endereço necessário
                </p>
                <p className="mt-2 text-sm leading-relaxed text-stone-600">
                  Para fechar o pedido, cadastre seu endereço sem sair do
                  carrinho.
                </p>
                <button
                  type="button"
                  onClick={openAddressModal}
                  className="pc-btn pc-btn-accent mt-4 inline-flex text-sm"
                >
                  Cadastrar endereço
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={handleCheckout}
              disabled={checkoutLoading || actionLoading}
              className="pc-btn pc-btn-accent mt-6 w-full disabled:cursor-not-allowed disabled:opacity-60"
            >
              {checkoutLoading ? "Fechando pedido..." : "Finalizar compra"}
            </button>

            <Link
              href="/produtos"
              className="pc-btn pc-btn-secondary mt-3 flex w-full justify-center text-sm"
            >
              Continuar comprando
            </Link>
          </aside>
        </div>
      </div>

      {addressModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-stone-950/50 px-4 py-8 backdrop-blur-sm">
          <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-[2rem] border border-stone-200 bg-white p-6 shadow-[0_24px_70px_rgba(28,25,23,0.22)] md:p-8">
            <div className="flex items-start justify-between gap-4 border-b border-stone-200 pb-5">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#8f6f2e]">
                  Endereço de entrega
                </p>
                <h2 className="mt-2 font-[family-name:var(--font-rubik)] text-2xl font-semibold tracking-[-0.035em] text-stone-950">
                  Cadastre seu endereço
                </h2>
                <p className="mt-2 text-sm leading-6 text-stone-500">
                  Preencha os dados para continuar a finalização sem sair do
                  carrinho.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setAddressModalOpen(false)}
                disabled={addressLoading}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-stone-200 bg-white text-stone-600 transition hover:bg-[#fbfaf7] hover:text-stone-950 disabled:cursor-not-allowed disabled:opacity-60"
                aria-label="Fechar cadastro de endereço"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            <form onSubmit={handleAddressSubmit} className="mt-6 space-y-5">
              <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
                <label className="block">
                  <span className="text-sm font-semibold text-stone-950">
                    CEP
                  </span>
                  <input
                    value={addressForm.cep}
                    onChange={(event) => {
                      setAddressForm((current) => ({
                        ...current,
                        cep: formatCep(event.target.value),
                      }));
                      setAddressCepError("");
                    }}
                    onBlur={handleAddressCepBlur}
                    placeholder="00000-000"
                    required
                    className="mt-2 h-12 w-full rounded-full border border-stone-200 bg-[#fbfaf7] px-4 text-sm font-medium text-stone-950 outline-none transition placeholder:text-stone-400 focus:border-[#d8c28f] focus:bg-white"
                  />
                </label>

                <div className="flex items-end">
                  <div className="flex h-12 items-center gap-2 rounded-full border border-stone-200 bg-[#fbfaf7] px-4 text-sm font-semibold text-stone-600">
                    {cepLoading ? (
                      <Loader2
                        className="h-4 w-4 animate-spin"
                        aria-hidden="true"
                      />
                    ) : (
                      <MapPin
                        className="h-4 w-4 text-[#8f6f2e]"
                        aria-hidden="true"
                      />
                    )}
                    {cepLoading ? "Buscando" : "ViaCEP"}
                  </div>
                </div>
              </div>

              {addressCepError && (
                <p className="text-sm font-medium text-[var(--pc-danger)]">
                  {addressCepError}
                </p>
              )}

              <div className="grid gap-4 sm:grid-cols-[1fr_120px]">
                <label className="block">
                  <span className="text-sm font-semibold text-stone-950">
                    Rua
                  </span>
                  <input
                    value={addressForm.street}
                    onChange={(event) =>
                      setAddressForm((current) => ({
                        ...current,
                        street: event.target.value,
                      }))
                    }
                    placeholder="Rua, avenida ou travessa"
                    required
                    className="mt-2 h-12 w-full rounded-full border border-stone-200 bg-[#fbfaf7] px-4 text-sm font-medium text-stone-950 outline-none transition placeholder:text-stone-400 focus:border-[#d8c28f] focus:bg-white"
                  />
                </label>

                <label className="block">
                  <span className="text-sm font-semibold text-stone-950">
                    Número
                  </span>
                  <input
                    value={addressForm.number}
                    onChange={(event) =>
                      setAddressForm((current) => ({
                        ...current,
                        number: event.target.value,
                      }))
                    }
                    placeholder="123"
                    required
                    className="mt-2 h-12 w-full rounded-full border border-stone-200 bg-[#fbfaf7] px-4 text-sm font-medium text-stone-950 outline-none transition placeholder:text-stone-400 focus:border-[#d8c28f] focus:bg-white"
                  />
                </label>
              </div>

              <label className="block">
                <span className="text-sm font-semibold text-stone-950">
                  Complemento
                </span>
                <input
                  value={addressForm.complement}
                  onChange={(event) =>
                    setAddressForm((current) => ({
                      ...current,
                      complement: event.target.value,
                    }))
                  }
                  placeholder="Apartamento, bloco, referência..."
                  className="mt-2 h-12 w-full rounded-full border border-stone-200 bg-[#fbfaf7] px-4 text-sm font-medium text-stone-950 outline-none transition placeholder:text-stone-400 focus:border-[#d8c28f] focus:bg-white"
                />
              </label>

              <div className="grid gap-4 sm:grid-cols-[1fr_120px]">
                <label className="block">
                  <span className="text-sm font-semibold text-stone-950">
                    Cidade
                  </span>
                  <input
                    value={addressForm.city}
                    onChange={(event) =>
                      setAddressForm((current) => ({
                        ...current,
                        city: event.target.value,
                      }))
                    }
                    placeholder="Cidade"
                    required
                    className="mt-2 h-12 w-full rounded-full border border-stone-200 bg-[#fbfaf7] px-4 text-sm font-medium text-stone-950 outline-none transition placeholder:text-stone-400 focus:border-[#d8c28f] focus:bg-white"
                  />
                </label>

                <label className="block">
                  <span className="text-sm font-semibold text-stone-950">
                    Estado
                  </span>
                  <input
                    value={addressForm.state}
                    onChange={(event) =>
                      setAddressForm((current) => ({
                        ...current,
                        state: event.target.value.toUpperCase().slice(0, 2),
                      }))
                    }
                    placeholder="SP"
                    required
                    maxLength={2}
                    className="mt-2 h-12 w-full rounded-full border border-stone-200 bg-[#fbfaf7] px-4 text-sm font-medium uppercase text-stone-950 outline-none transition placeholder:text-stone-400 focus:border-[#d8c28f] focus:bg-white"
                  />
                </label>
              </div>

              <div className="flex flex-col-reverse gap-3 border-t border-stone-200 pt-5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setAddressModalOpen(false)}
                  disabled={addressLoading}
                  className="pc-btn pc-btn-secondary justify-center text-sm disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={addressLoading || cepLoading}
                  className="pc-btn pc-btn-accent justify-center text-sm disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {addressLoading ? "Salvando..." : "Salvar e continuar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function getCepErrorMessage(error: unknown) {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return "CEP inválido ou não encontrado.";
}

function SummaryRow({
  label,
  value,
  strong = false,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
      <span
        className={`text-sm ${
          strong ? "font-semibold text-stone-900" : "font-medium text-stone-500"
        }`}
      >
        {label}
      </span>
      <span
        className={`min-w-0 text-right break-words tabular-nums ${
          strong
            ? "font-[family-name:var(--font-rubik)] text-xl font-semibold text-stone-900"
            : "text-sm font-semibold text-stone-800"
        }`}
      >
        {value}
      </span>
    </div>
  );
}
