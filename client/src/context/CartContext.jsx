import { createContext, useContext, useState, useEffect } from "react";

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const [activeShop, setActiveShop] = useState(() => {
    try {
      const s = localStorage.getItem("shopflow_active_shop");
      return s ? JSON.parse(s) : null;
    } catch {
      return null;
    }
  });

  const [cartItems, setCartItems] = useState(() => {
    try {
      const items = localStorage.getItem("shopflow_cart");
      return items ? JSON.parse(items) : [];
    } catch {
      return [];
    }
  });

  // Sync with localStorage
  useEffect(() => {
    try {
      if (cartItems.length === 0) {
        localStorage.removeItem("shopflow_cart");
        localStorage.removeItem("shopflow_active_shop");
        setActiveShop(null);
      } else {
        localStorage.setItem("shopflow_cart", JSON.stringify(cartItems));
        if (activeShop) {
          localStorage.setItem("shopflow_active_shop", JSON.stringify(activeShop));
        }
      }
    } catch {
      // ignore
    }
  }, [cartItems, activeShop]);

  /**
   * Add a product to the cart.
   * Enforces the single-shop rule. If adding from a different shop, returns { success: false, conflict: true }.
   */
  const addToCart = (product, shop, qty = 1) => {
    // Check cross-shop conflict
    if (activeShop && activeShop.id !== shop.id && cartItems.length > 0) {
      return {
        success: false,
        conflict: true,
        currentShop: activeShop,
        newShop: shop,
      };
    }

    if (!activeShop || cartItems.length === 0) {
      setActiveShop({
        id: shop.id,
        shopId: shop.shopId,
        shopName: shop.shopName,
        address: shop.address,
        upiId: shop.upiId,
      });
    }

    setCartItems((prev) => {
      const existing = prev.find((i) => i.productId === product.id);
      if (existing) {
        return prev.map((i) =>
          i.productId === product.id ? { ...i, quantity: i.quantity + qty } : i
        );
      } else {
        return [
          ...prev,
          {
            productId: product.id,
            productName: product.name,
            sellingPrice: parseFloat(product.sellingPrice),
            unit: product.unit || "piece",
            imageUrl: product.imageUrl || null,
            quantity: qty,
            shopId: shop.id,
          },
        ];
      }
    });

    return { success: true };
  };

  /**
   * Force add product after clearing previous shop cart
   */
  const forceAddFromNewShop = (product, shop, qty = 1) => {
    setActiveShop({
      id: shop.id,
      shopId: shop.shopId,
      shopName: shop.shopName,
      address: shop.address,
      upiId: shop.upiId,
    });
    setCartItems([
      {
        productId: product.id,
        productName: product.name,
        sellingPrice: parseFloat(product.sellingPrice),
        unit: product.unit || "piece",
        imageUrl: product.imageUrl || null,
        quantity: qty,
        shopId: shop.id,
      },
    ]);
  };

  const updateQuantity = (productId, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCartItems((prev) =>
      prev.map((i) => (i.productId === productId ? { ...i, quantity: newQuantity } : i))
    );
  };

  const removeFromCart = (productId) => {
    setCartItems((prev) => prev.filter((i) => i.productId !== productId));
  };

  const clearCart = () => {
    setCartItems([]);
    setActiveShop(null);
  };

  const totalCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  const subtotal = parseFloat(
    cartItems.reduce((sum, item) => sum + item.sellingPrice * item.quantity, 0).toFixed(2)
  );

  return (
    <CartContext.Provider
      value={{
        activeShop,
        cartItems,
        totalCount,
        subtotal,
        addToCart,
        forceAddFromNewShop,
        updateQuantity,
        removeFromCart,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

// oxlint-disable-next-line react/only-export-components
export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};
