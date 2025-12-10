import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { CartItem, Product } from '../types';

function generateUUID(): string {
  // Use crypto.randomUUID if available, otherwise fallback to a polyfill
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  
  // Fallback for browsers that don't support crypto.randomUUID
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

function getSessionId(): string {
  let sessionId = sessionStorage.getItem('cart_session_id');
  if (!sessionId) {
    sessionId = generateUUID();
    sessionStorage.setItem('cart_session_id', sessionId);
  }
  return sessionId;
}

export function useCart() {
  const [cartItems, setCartItems] = useState<(CartItem & { product: Product })[]>([]);
  const [loading, setLoading] = useState(true);

  async function fetchCart() {
    const sessionId = getSessionId();
    const { data } = await supabase
      .from('cart_items')
      .select(`
        *,
        product:products(*)
      `)
      .eq('session_id', sessionId);

    if (data) {
      setCartItems(data as (CartItem & { product: Product })[]);
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchCart();
  }, []);

  async function addToCart(productId: string) {
    const sessionId = getSessionId();

    const existingItem = cartItems.find(item => item.product_id === productId);

    if (existingItem) {
      await (supabase
        .from('cart_items') as any) // eslint-disable-line @typescript-eslint/no-explicit-any
        .update({ quantity: existingItem.quantity + 1 })
        .eq('id', existingItem.id);
    } else {
      await (supabase
        .from('cart_items') as any) // eslint-disable-line @typescript-eslint/no-explicit-any
        .insert({ session_id: sessionId, product_id: productId, quantity: 1 });
    }

    await fetchCart();
  }

  async function updateQuantity(itemId: string, quantity: number) {
    if (quantity <= 0) {
      await removeFromCart(itemId);
      return;
    }

    await (supabase
      .from('cart_items') as any) // eslint-disable-line @typescript-eslint/no-explicit-any
      .update({ quantity })
      .eq('id', itemId);

    await fetchCart();
  }

  async function removeFromCart(itemId: string) {
    await supabase
      .from('cart_items')
      .delete()
      .eq('id', itemId);

    await fetchCart();
  }

  const total = cartItems.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );

  const itemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return {
    cartItems,
    loading,
    addToCart,
    updateQuantity,
    removeFromCart,
    total,
    itemCount
  };
}
