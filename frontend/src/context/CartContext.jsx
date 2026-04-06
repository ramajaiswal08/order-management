import React, { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();
  
export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState(() => {
    const saved = localStorage.getItem('cart');
    return saved ? JSON.parse(saved) : [];
  });

   useEffect(() => {
    try {
      localStorage.setItem('cart', JSON.stringify(cart));
    } catch (e) {
      console.error("Failed to save cart to localStorage", e);
    }
  }, [cart]);


  const addToCart = (product) => {
    setCart(prev => {
      const existing = prev.find(item => item.PRODUCT_ID === product.PRODUCT_ID);
      if (existing) {
        return prev.map(item => 
          item.PRODUCT_ID === product.PRODUCT_ID ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const removeFromCart = (productId) => {
    setCart(prev => prev.filter(item => item.PRODUCT_ID !== productId));
  };

  const updateQuantity = (productId, q) => {
    setCart(prev => prev.map(item => 
      item.PRODUCT_ID === productId ? { ...item, quantity: Math.max(1, q) } : item
    ));
  };

  const clearCart = () => setCart([]);

  const total = cart.reduce((acc, item) => acc + item.PRICE * item.quantity, 0);

  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, updateQuantity, clearCart, total }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
