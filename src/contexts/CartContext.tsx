"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { OrderItemResponse, OrderResponse, ShippingQuoteResponse } from "@/types/order";
import type { ProductResponse } from "@/types/product";
import { orderService } from "@/services/orderService";
import { addressService } from "@/services/addressService";
import { useAuth } from "./AuthContext";

type CartToastState = {
  visible: boolean;
  productName: string;
  productImageUrl?: string | null;
  quantity: number;
};

type CartContextValue = {
  cart: OrderResponse | null;
  cartItems: OrderItemResponse[];
  cartCount: number;
  cartSubtotal: number;
  cartTotal: number;
  loading: boolean;
  actionLoading: boolean;
  cartToast: CartToastState;
  refreshCart: () => Promise<OrderResponse | null>;
  addToCart: (product: ProductResponse, quantity?: number) => Promise<OrderResponse>;
  updateItemQuantity: (itemId: number, quantity: number) => Promise<OrderResponse>;
  incrementItem: (item: OrderItemResponse) => Promise<OrderResponse>;
  decrementItem: (item: OrderItemResponse) => Promise<OrderResponse | null>;
  removeItem: (itemId: number) => Promise<OrderResponse>;
  applyCoupon: (code: string) => Promise<OrderResponse>;
  removeCoupon: () => Promise<OrderResponse>;
  quoteShippingByCep: (cep: string) => Promise<ShippingQuoteResponse>;
  quoteOrderShipping: (cep: string) => Promise<ShippingQuoteResponse>;
  closeCart: () => Promise<OrderResponse>;
  hideCartToast: () => void;
  clearLocalCart: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

type CartProviderProps = {
  children: ReactNode;
};

const EMPTY_TOAST: CartToastState = {
  visible: false,
  productName: "",
  productImageUrl: null,
  quantity: 0,
};

export function CartProvider({ children }: CartProviderProps) {
  const { user, isAuthenticated } = useAuth();

  const [cart, setCart] = useState<OrderResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [cartToast, setCartToast] = useState<CartToastState>(EMPTY_TOAST);

  const cartItems = cart?.items ?? [];

  const cartCount = useMemo(() => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  }, [cartItems]);

  const cartSubtotal = cart?.itemsAmount ?? 0;
  const cartTotal = cart?.totalAmount ?? cartSubtotal;

  const clearLocalCart = useCallback(() => {
    setCart(null);
    setCartToast(EMPTY_TOAST);
  }, []);

  const refreshCart = useCallback(async (): Promise<OrderResponse | null> => {
    if (!isAuthenticated) {
      clearLocalCart();
      return null;
    }

    setLoading(true);

    try {
      const response = await orderService.findCurrentCart();
      setCart(response ?? null);
      return response ?? null;
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, clearLocalCart]);

  useEffect(() => {
    if (!isAuthenticated) {
      clearLocalCart();
      return;
    }

    refreshCart();
  }, [isAuthenticated, user?.id, refreshCart, clearLocalCart]);

  const getOrCreateCart = useCallback(async (): Promise<OrderResponse> => {
    if (!user) {
      throw new Error("Faça login para adicionar produtos ao carrinho.");
    }

    if (cart && cart.status === "PENDING") {
      return cart;
    }

    const currentCart = await orderService.findCurrentCart();

    if (currentCart) {
      setCart(currentCart);
      return currentCart;
    }

    const createdCart = await orderService.create({
      userId: user.id,
    });

    setCart(createdCart);

    return createdCart;
  }, [cart, user]);

  const showCartToast = useCallback(
    (product: ProductResponse, quantity: number) => {
      setCartToast({
        visible: true,
        productName: product.name,
        productImageUrl: product.imageUrl,
        quantity,
      });

      window.setTimeout(() => {
        setCartToast((current) => ({
          ...current,
          visible: false,
        }));
      }, 3000);
    },
    []
  );

  const hideCartToast = useCallback(() => {
    setCartToast((current) => ({
      ...current,
      visible: false,
    }));
  }, []);

  const addToCart = useCallback(
    async (
      product: ProductResponse,
      quantity: number = 1
    ): Promise<OrderResponse> => {
      if (quantity < 1) {
        throw new Error("Quantidade inválida.");
      }

      setActionLoading(true);

      try {
        const activeCart = await getOrCreateCart();

        const updatedCart = await orderService.addItem(activeCart.id, {
          productId: product.id,
          quantity,
        });

        setCart(updatedCart);
        showCartToast(product, quantity);

        return updatedCart;
      } finally {
        setActionLoading(false);
      }
    },
    [getOrCreateCart, showCartToast]
  );

  const updateItemQuantity = useCallback(
    async (itemId: number, quantity: number): Promise<OrderResponse> => {
      if (!cart) {
        throw new Error("Carrinho não encontrado.");
      }

      if (quantity < 1) {
        throw new Error("Quantidade inválida.");
      }

      setActionLoading(true);

      try {
        const updatedCart = await orderService.updateItem(cart.id, itemId, {
          quantity,
        });

        setCart(updatedCart);

        return updatedCart;
      } finally {
        setActionLoading(false);
      }
    },
    [cart]
  );

  const incrementItem = useCallback(
    async (item: OrderItemResponse): Promise<OrderResponse> => {
      return updateItemQuantity(item.id, item.quantity + 1);
    },
    [updateItemQuantity]
  );

  const decrementItem = useCallback(
    async (item: OrderItemResponse): Promise<OrderResponse | null> => {
      if (!cart) {
        throw new Error("Carrinho não encontrado.");
      }

      if (item.quantity <= 1) {
        const updatedCart = await orderService.removeItem(cart.id, item.id);
        setCart(updatedCart);
        return updatedCart;
      }

      return updateItemQuantity(item.id, item.quantity - 1);
    },
    [cart, updateItemQuantity]
  );

  const removeItem = useCallback(
    async (itemId: number): Promise<OrderResponse> => {
      if (!cart) {
        throw new Error("Carrinho não encontrado.");
      }

      setActionLoading(true);

      try {
        const updatedCart = await orderService.removeItem(cart.id, itemId);
        setCart(updatedCart);
        return updatedCart;
      } finally {
        setActionLoading(false);
      }
    },
    [cart]
  );

  const applyCoupon = useCallback(
    async (code: string): Promise<OrderResponse> => {
      if (!cart) {
        throw new Error("Carrinho não encontrado.");
      }

      setActionLoading(true);

      try {
        const updatedCart = await orderService.applyCoupon(cart.id, {
          code,
        });

        setCart(updatedCart);

        return updatedCart;
      } finally {
        setActionLoading(false);
      }
    },
    [cart]
  );

  const removeCoupon = useCallback(async (): Promise<OrderResponse> => {
    if (!cart) {
      throw new Error("Carrinho não encontrado.");
    }

    setActionLoading(true);

    try {
      const updatedCart = await orderService.removeCoupon(cart.id);
      setCart(updatedCart);
      return updatedCart;
    } finally {
      setActionLoading(false);
    }
  }, [cart]);

  const quoteShippingByCep = useCallback(
    async (cep: string): Promise<ShippingQuoteResponse> => {
      return addressService.quoteByCep(cep);
    },
    []
  );

  const quoteOrderShipping = useCallback(
    async (cep: string): Promise<ShippingQuoteResponse> => {
      if (!cart) {
        throw new Error("Carrinho não encontrado.");
      }

      return orderService.quoteShipping(cart.id, {
        cep,
      });
    },
    [cart]
  );

  const closeCart = useCallback(async (): Promise<OrderResponse> => {
    if (!cart) {
      throw new Error("Carrinho não encontrado.");
    }

    setActionLoading(true);

    try {
      const closedOrder = await orderService.close(cart.id);
      setCart(null);
      return closedOrder;
    } finally {
      setActionLoading(false);
    }
  }, [cart]);

  const value = useMemo<CartContextValue>(
    () => ({
      cart,
      cartItems,
      cartCount,
      cartSubtotal,
      cartTotal,
      loading,
      actionLoading,
      cartToast,
      refreshCart,
      addToCart,
      updateItemQuantity,
      incrementItem,
      decrementItem,
      removeItem,
      applyCoupon,
      removeCoupon,
      quoteShippingByCep,
      quoteOrderShipping,
      closeCart,
      hideCartToast,
      clearLocalCart,
    }),
    [
      cart,
      cartItems,
      cartCount,
      cartSubtotal,
      cartTotal,
      loading,
      actionLoading,
      cartToast,
      refreshCart,
      addToCart,
      updateItemQuantity,
      incrementItem,
      decrementItem,
      removeItem,
      applyCoupon,
      removeCoupon,
      quoteShippingByCep,
      quoteOrderShipping,
      closeCart,
      hideCartToast,
      clearLocalCart,
    ]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error("useCart deve ser usado dentro de CartProvider");
  }

  return context;
}