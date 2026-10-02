import { createContext, useContext, useEffect, useMemo, useState } from 'react';

import type { CartProduct, Product } from '../types';

type CartContextValue = {
  items: CartProduct[];
  itemCount: number;
  subtotal: number;
  addToCart: (product: Product, quantity?: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  removeFromCart: (productId: number) => void;
  clearCart: () => void;
};

const CartContext = createContext<CartContextValue | undefined>(undefined);

const STORAGE_KEY = 'lumora-cart';

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartProduct[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const addToCart = (product: Product, quantity = 1) => {
    setItems((currentItems) => {
      const existing = currentItems.find((item) => item.productId === product.id);
      if (existing) {
        return currentItems.map((item) =>
          item.productId === product.id
            ? { ...item, quantity: Math.min(item.quantity + quantity, product.stockQuantity) }
            : item,
        );
      }

      return [
        ...currentItems,
        {
          productId: product.id,
          quantity: Math.min(quantity, product.stockQuantity),
          name: product.name,
          price: product.price,
          image: product.image,
          stockQuantity: product.stockQuantity,
        },
      ];
    });
  };

  const updateQuantity = (productId: number, quantity: number) => {
    setItems((currentItems) =>
      currentItems
        .map((item) => (item.productId === productId ? { ...item, quantity } : item))
        .filter((item) => item.quantity > 0),
    );
  };

  const removeFromCart = (productId: number) => {
    setItems((currentItems) => currentItems.filter((item) => item.productId !== productId));
  };

  const clearCart = () => setItems([]);

  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [items],
  );

  const itemCount = useMemo(
    () => items.reduce((count, item) => count + item.quantity, 0),
    [items],
  );

  const value = useMemo<CartContextValue>(
    () => ({ items, itemCount, subtotal, addToCart, updateQuantity, removeFromCart, clearCart }),
    [items, itemCount, subtotal],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used inside CartProvider');
  }
  return context;
}
