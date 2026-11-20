import { createContext, useContext, useState, useEffect } from "react";

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const [activeShop, setActiveShop] = useState(() => {
    try {
      const s = localStorage.getItem("shopflow_active_shop");
      return s && s !== "undefined" && s !== "null" ? JSON.parse(s) : null;
    } catch {
      return null;
    }
  });

  const [cartItems, setCartItems] = useState(() => {
    try {
      const items = localStorage.getItem("shopflow_cart");
      return items && items !== "undefined" && items !== "null" ? JSON.parse(items) : [];
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
   * Enforces:
   * 1. Single-shop rule: If adding from a different shop, returns { success: false, conflict: true }.
   * 2. Stock limits: If item is out of stock or requested quantity exceeds available stock, adding is blocked.
   */
  const addToCart = (product, shop, qty = 1) => {
    // Check cross-shop conflict
    if (activeShop && activeShop.id !== shop.id && cartItems.length > 0) {
      return {
        success: false,
        conflict: true,
        currentShop: activeShop,
        newShop: shop,
        pendingProduct: product,
      };
    }

    // Determine available stock
    const availableStock =
      product.stockQuantity !== undefined && product.stockQuantity !== null
        ? Math.max(0, parseInt(product.stockQuantity, 10) || 0)
        : 999999;

    // Check if out of stock
    if (availableStock <= 0 || product.isAvailable === false || product.availability === "OUT_OF_STOCK") {
      return {
        success: false,
        outOfStock: true,
        maxStock: 0,
        message: `"${product.name}" is currently out of stock.`,
      };
    }

    const existing = cartItems.find((i) => i.productId === product.id);
    const currentQty = existing ? existing.quantity : 0;

    // Check if stock limit is reached
    if (currentQty >= availableStock) {
      return {
        success: false,
        stockLimitReached: true,
        maxStock: availableStock,
        currentQty,
        message: `Cannot add more. Only ${availableStock} ${product.unit || "unit"}(s) available in stock.`,
      };
    }

    const targetQty = Math.min(currentQty + qty, availableStock);

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
      const match = prev.find((i) => i.productId === product.id);
      if (match) {
        return prev.map((i) =>
          i.productId === product.id
            ? { ...i, quantity: targetQty, stockQuantity: availableStock }
            : i
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
            quantity: targetQty,
            stockQuantity: availableStock,
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
    const availableStock =
      product.stockQuantity !== undefined && product.stockQuantity !== null
        ? Math.max(0, parseInt(product.stockQuantity, 10) || 0)
        : 999999;

    if (availableStock <= 0 || product.isAvailable === false || product.availability === "OUT_OF_STOCK") {
      return {
        success: false,
        outOfStock: true,
        message: `"${product.name}" is currently out of stock.`,
      };
    }

    const targetQty = Math.min(qty, availableStock);

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
        quantity: targetQty,
        stockQuantity: availableStock,
        shopId: shop.id,
      },
    ]);
    return { success: true };
  };

  const updateQuantity = (productId, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
      return { success: true };
    }

    let reachedMax = false;
    let allowedMax = 999999;

    setCartItems((prev) =>
      prev.map((i) => {
        if (i.productId === productId) {
          const maxStock =
            i.stockQuantity !== undefined && i.stockQuantity !== null
              ? i.stockQuantity
              : 999999;
          allowedMax = maxStock;
          if (newQuantity > maxStock) {
            reachedMax = true;
            return { ...i, quantity: maxStock };
          }
          return { ...i, quantity: newQuantity };
        }
        return i;
      })
    );

    if (reachedMax) {
      return {
        success: false,
        stockLimitReached: true,
        maxStock: allowedMax,
        message: `Maximum available stock is ${allowedMax}.`,
      };
    }

    return { success: true };
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
    cartItems.reduce((sum, item) => sum + (parseFloat(item.sellingPrice) || 0) * item.quantity, 0).toFixed(2)
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
