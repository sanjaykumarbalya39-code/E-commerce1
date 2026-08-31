import { Link, useNavigate } from "react-router-dom";
import QuantityControl from "../components/QuantityControl";
import ProductImage from "../components/ProductImage";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { useToast } from "../context/ToastContext";
import { formatPrice } from "../utils/format";

export default function Cart() {
  const { items, subtotal, updateQuantity, removeItem } = useCart();
  const { user } = useAuth();
  const { notify } = useToast();
  const navigate = useNavigate();
  const total = subtotal;

  const changeQty = async (productId, quantity) => {
    try {
      await updateQuantity(productId, quantity);
    } catch (error) {
      notify(error.message, "err");
    }
  };

  return (
    <div className="container">
      <div className="page-head">
        <p className="eyebrow">Your bag</p>
        <h1>Cart</h1>
      </div>
      {items.length === 0 ? (
        <div className="empty">
          The bag is empty.
          <div className="btn-row" style={{ justifyContent: "center" }}>
            <Link className="btn" to="/shop">Continue browsing</Link>
          </div>
        </div>
      ) : (
        <div className="cart-layout">
          <div className="card">
            {items.map((item) => (
              <div key={item.product_id} className="line-item">
                <ProductImage src={item.image_url} alt={item.name} />
                <div>
                  <Link to={`/product/${item.product_id}`}><strong>{item.name}</strong></Link>
                  <div className="kicker">{item.category}</div>
                  <p>{formatPrice(item.price)}</p>
                  <QuantityControl
                    value={item.quantity}
                    max={item.stock || 99}
                    onChange={(value) => changeQty(item.product_id, value)}
                  />
                </div>
                <button className="text-btn" onClick={() => removeItem(item.product_id)}>
                  Remove
                </button>
              </div>
            ))}
          </div>
          <aside className="card summary">
            <h3>Summary</h3>
            <div className="summary-row"><span>Subtotal</span><span>{formatPrice(subtotal)}</span></div>
            <div className="summary-row"><span>Shipping</span><span>Complimentary</span></div>
            <div className="summary-row total"><span>Total</span><span>{formatPrice(total)}</span></div>
            <button
              className="btn"
              style={{ width: "100%", marginTop: "1rem" }}
              onClick={() => navigate(user ? "/checkout" : "/login", { state: { from: "/checkout" } })}
            >
              {user ? "Checkout" : "Sign in to checkout"}
            </button>
          </aside>
        </div>
      )}
    </div>
  );
}
