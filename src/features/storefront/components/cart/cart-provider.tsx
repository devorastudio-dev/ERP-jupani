"use client";

import type { ReactNode } from "react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { Cart } from "@/features/storefront/lib/types";

type AddItemPayload = {
  productId: string;
  name: string;
  slug: string;
  image?: string | null;
  unitPrice: number;
  quantity?: number;
  itemNotes?: string | null;
};

type CartContextValue = {
  cart: Cart | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  addItem: (payload: AddItemPayload) => Promise<void>;
  updateItem: (payload: {
    productId: string;
    quantity: number;
    itemNotes?: string | null;
  }) => Promise<void>;
  removeItem: (productId: string) => Promise<void>;
  clear: () => Promise<void>;
  setNotes: (notes: string) => Promise<void>;
};

const CartContext = createContext<CartContextValue | null>(null);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);
      const response = await fetch("/api/cart", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.message ?? "Erro ao carregar carrinho.");
      }
      setCart(data.cart);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro inesperado.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void refresh();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [refresh]);

  const request = useCallback(
    async (body: Record<string, unknown>, method: string) => {
      const response = await fetch("/api/cart", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.message ?? "Erro ao atualizar carrinho.");
      }
      setCart(data.cart);
    },
    []
  );

  const addItem = useCallback(
    async (payload: AddItemPayload) => {
      setError(null);
      try {
        await request(
          {
            ...payload,
            quantity: payload.quantity ?? 1,
          },
          "POST"
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao adicionar.");
      }
    },
    [request]
  );

  const updateItem = useCallback(
    async (payload: {
      productId: string;
      quantity: number;
      itemNotes?: string | null;
    }) => {
      setError(null);
      try {
        await request(payload, "PATCH");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao atualizar.");
      }
    },
    [request]
  );

  const removeItem = useCallback(
    async (productId: string) => {
      setError(null);
      try {
        await request({ productId }, "DELETE");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao remover.");
      }
    },
    [request]
  );

  const clear = useCallback(async () => {
    setError(null);
    try {
      await request({ clear: true }, "DELETE");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao limpar.");
    }
  }, [request]);

  const setNotes = useCallback(
    async (notes: string) => {
      setError(null);
      try {
        await request({ notes }, "PATCH");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao atualizar.");
      }
    },
    [request]
  );

  const value = useMemo<CartContextValue>(
    () => ({
      cart,
      loading,
      error,
      refresh,
      addItem,
      updateItem,
      removeItem,
      clear,
      setNotes,
    }),
    [cart, loading, error, refresh, addItem, updateItem, removeItem, clear, setNotes]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart deve ser usado dentro de CartProvider.");
  }
  return context;
};
