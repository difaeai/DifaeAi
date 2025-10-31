
"use client";

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { useToast } from "@/hooks/use-toast";

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
}

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (item: Omit<CartItem, 'quantity'>) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  cartCount: number;
  cartTotal: number;
  isCartOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  setCartOpen: (isOpen: boolean) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const { toast } = useToast();

  const openCart = () => setIsCartOpen(true);
  const closeCart = () => setIsCartOpen(false);
  const setCartOpen = (isOpen: boolean) => setIsCartOpen(isOpen);

  const addToCart = (itemToAdd: Omit<CartItem, 'quantity'>) => {
    setCartItems(prevItems => {
      const existingItem = prevItems.find(item => item.id === itemToAdd.id);
      if (existingItem) {
        return prevItems.map(item =>
          item.id === itemToAdd.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prevItems, { ...itemToAdd, quantity: 1 }];
    });
    
    toast({
      title: "Added to Cart",
      description: `${itemToAdd.name} has been added to your cart.`,
    });
    openCart();
  };

  const removeFromCart = (id: string) => {
    setCartItems(prevItems => prevItems.filter(item => item.id !== id));
    toast({
      title: "Item Removed",
      description: "The item has been removed from your cart.",
      variant: "destructive"
    });
  };

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(id);
    } else {
       setCartItems(prevItems => prevItems.map(item => (item.id === id ? { ...item, quantity } : item)));
    }
  };
  
  const clearCart = () => {
    setCartItems([]);
  };

  const cartCount = cartItems.reduce((count, item) => count + item.quantity, 0);
  const cartTotal = cartItems.reduce((total, item) => total + item.price * item.quantity, 0);

  return (
    <CartContext.Provider value={{ cartItems, addToCart, removeFromCart, updateQuantity, clearCart, cartCount, cartTotal, isCartOpen, openCart, closeCart, setCartOpen }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
