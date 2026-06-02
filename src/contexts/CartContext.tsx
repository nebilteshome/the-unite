import React, { createContext, useContext, useEffect, useState } from 'react';
import posthog from 'posthog-js';
import { useAuth } from './AuthContext';
import { supabase, Product } from '../lib/supabase';

export type CartItem = {
  product: Product;
  quantity: number;
  size?: string;
};

type CartContextType = {
  items: CartItem[];
  addToCart: (product: Product, size?: string) => void;
  removeFromCart: (productId: string, size?: string) => void;
  updateQuantity: (productId: string, quantity: number, size?: string) => void;
  clearCart: () => void;
  total: number;
  isCartOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
};

const CartContext = createContext<CartContextType>({
  items: [],
  addToCart: () => {},
  removeFromCart: () => {},
  updateQuantity: () => {},
  clearCart: () => {},
  total: 0,
  isCartOpen: false,
  openCart: () => {},
  closeCart: () => {},
});

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Load from local storage initially
  useEffect(() => {
    const saved = localStorage.getItem('guest_cart');
    if (saved) {
      try { setItems(JSON.parse(saved)); } catch (e) {}
    }
  }, []);

  // Sync to database if logged in, otherwise local storage
  useEffect(() => {
    if (user && supabase) {
      // Fetch cart from supabase on login
      supabase.from('profiles').select('cart_items').eq('id', user.id).single()
        .then(({ data }) => {
          if (data && data.cart_items) {
            const dbItems = data.cart_items as CartItem[] || [];
            if (dbItems.length > 0) {
              setItems(prevItems => {
                 const merged = [...dbItems];
                 prevItems.forEach(localItem => {
                   const existing = merged.find(i => i.product.id === localItem.product.id && i.size === localItem.size);
                   if (existing) existing.quantity += localItem.quantity;
                   else merged.push(localItem);
                 });
                 return merged;
              });
            }
            localStorage.removeItem('guest_cart');
          }
        });
    }
  }, [user]);

  // Save changes
  useEffect(() => {
    if (user && supabase) {
      supabase.from('profiles').upsert({ id: user.id, email: user.email, cart_items: items }).then();
    } else {
      localStorage.setItem('guest_cart', JSON.stringify(items));
    }
  }, [items, user]);

  const addToCart = (product: Product, size?: string) => {
    posthog.capture('add_to_cart', {
      product_id: product.id,
      product_name: product.name,
      price: product.price,
      size: size
    });
    setItems(prev => {
      const existing = prev.find(i => i.product.id === product.id && i.size === size);
      if (existing) {
        return prev.map(i => i === existing ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { product, quantity: 1, size }];
    });
    setIsCartOpen(true);
  };

  const removeFromCart = (productId: string, size?: string) => {
    setItems(prev => prev.filter(i => !(i.product.id === productId && i.size === size)));
  };

  const updateQuantity = (productId: string, quantity: number, size?: string) => {
    if (quantity <= 0) {
      removeFromCart(productId, size);
      return;
    }
    setItems(prev => prev.map(i => (i.product.id === productId && i.size === size) ? { ...i, quantity } : i));
  };

  const clearCart = () => setItems([]);
  
  const openCart = () => setIsCartOpen(true);
  const closeCart = () => setIsCartOpen(false);

  const total = items.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);

  return (
    <CartContext.Provider value={{ items, addToCart, removeFromCart, updateQuantity, clearCart, total, isCartOpen, openCart, closeCart }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
