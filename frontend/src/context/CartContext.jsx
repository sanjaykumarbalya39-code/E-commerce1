import { createContext, useContext, useEffect, useMemo, useReducer, useRef } from "react";
import api from "../services/api";
import { useAuth } from "./AuthContext";

const CartContext = createContext(null);
const STORAGE_KEY = "velora_cart";

function cartReducer(state, action) {
  switch (action.type) {
    case "SET":
      return { items: action.items || [] };
    case "ADD": {
      const addQty = action.quantity || 1;
      const existing = state.items.find((item) => item.product_id === action.product.id);
      if (existing) {
        return {
          items: state.items.map((item) =>
            item.product_id === action.product.id
              ? { ...item, quantity: Math.min(item.quantity + addQty, action.product.stock) }
              : item
          ),
        };
      }
      return {
        items: [
          ...state.items,
          {
            product_id: action.product.id,
            name: action.product.name,
            price: action.product.price,
            image_url: action.product.image_url,
            stock: action.product.stock,
            category: action.product.category,
            quantity: addQty,
          },
        ],
      };
    }
    case "UPDATE":
      return {
        items: state.items
          .map((item) =>
            item.product_id === action.product_id
              ? { ...item, quantity: action.quantity }
              : item
          )
          .filter((item) => item.quantity > 0),
      };
    case "REMOVE":
      return {
        items: state.items.filter((item) => item.product_id !== action.product_id),
      };
    case "CLEAR":
      return { items: [] };
    default:
      return state;
  }
}

export function CartProvider({ children }) {
  const { token, ready } = useAuth();
  const [state, dispatch] = useReducer(cartReducer, { items: [] });
  const hydrated = useRef(false);

  useEffect(() => {
    if (!ready) return;
    let cancelled = false;

    async function loadCart() {
      if (token) {
        try {
          const local = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
          if (local.length) {
            const { data } = await api.post("/cart/merge", { items: local });
            if (!cancelled) dispatch({ type: "SET", items: data.items });
            localStorage.removeItem(STORAGE_KEY);
          } else {
            const { data } = await api.get("/cart");
            if (!cancelled) dispatch({ type: "SET", items: data.items });
          }
        } catch {
          if (!cancelled) dispatch({ type: "SET", items: [] });
        }
      } else {
        try {
          const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
          dispatch({ type: "SET", items: saved });
        } catch {
          dispatch({ type: "SET", items: [] });
        }
      }
      hydrated.current = true;
    }

    hydrated.current = false;
    loadCart();
    return () => {
      cancelled = true;
    };
  }, [token, ready]);

  useEffect(() => {
    if (!hydrated.current || token) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.items));
  }, [state.items, token]);

  const addItem = async (product, quantity = 1) => {
    if (product.stock < 1) {
      throw new Error("This piece is currently out of stock.");
    }
    if (token) {
      const { data } = await api.post("/cart", { product_id: product.id, quantity });
      dispatch({ type: "SET", items: data.items });
      return;
    }
    dispatch({ type: "ADD", product, quantity });
  };

  const updateQuantity = async (productId, quantity) => {
    if (token) {
      const { data } = await api.put(`/cart/${productId}`, { quantity });
      dispatch({ type: "SET", items: data.items });
      return;
    }
    dispatch({ type: "UPDATE", product_id: productId, quantity });
  };

  const removeItem = async (productId) => {
    if (token) {
      const { data } = await api.delete(`/cart/${productId}`);
      dispatch({ type: "SET", items: data.items });
      return;
    }
    dispatch({ type: "REMOVE", product_id: productId });
  };

  const clearCart = async () => {
    if (token) {
      const { data } = await api.delete("/cart");
      dispatch({ type: "SET", items: data.items });
      return;
    }
    dispatch({ type: "CLEAR" });
  };

  const value = useMemo(() => {
    const count = state.items.reduce((sum, item) => sum + item.quantity, 0);
    const subtotal = state.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
    return {
      items: state.items,
      count,
      subtotal,
      addItem,
      updateQuantity,
      removeItem,
      clearCart,
    };
  }, [state.items, token]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used inside CartProvider");
  }
  return context;
}
