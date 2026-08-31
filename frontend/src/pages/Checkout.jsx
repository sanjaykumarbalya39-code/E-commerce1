import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { useToast } from "../context/ToastContext";
import api from "../services/api";
import { formatPrice } from "../utils/format";

const emptyForm = {
  customer_name: "",
  phone: "",
  address: "",
  city: "",
  pincode: "",
};

export default function Checkout() {
  const { user } = useAuth();
  const { items, subtotal, clearCart } = useCart();
  const { notify } = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({ ...emptyForm, customer_name: user?.name || "" });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const update = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    setSaving(true);
    try {
      const { data } = await api.post("/orders", form);
      await clearCart();
      notify("Order placed");
      navigate(`/orders/${data.order.id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (items.length === 0) {
    return <div className="container empty">Add something to the bag before checking out.</div>;
  }

  return (
    <div className="container">
      <div className="page-head">
        <p className="eyebrow">Almost there</p>
        <h1>Checkout</h1>
      </div>
      <div className="checkout-layout">
        <form className="card auth-card form" onSubmit={submit}>
          <label>Full name
            <input name="customer_name" value={form.customer_name} onChange={update} required />
          </label>
          <label>Phone
            <input name="phone" value={form.phone} onChange={update} required />
          </label>
          <label>Address
            <textarea name="address" value={form.address} onChange={update} required />
          </label>
          <label>City
            <input name="city" value={form.city} onChange={update} required />
          </label>
          <label>PIN code
            <input name="pincode" value={form.pincode} onChange={update} required />
          </label>
          {error && <p className="error">{error}</p>}
          <button className="btn" disabled={saving}>{saving ? "Placing…" : "Place order"}</button>
        </form>
        <aside className="card summary">
          <h3>Your pieces</h3>
          {items.map((item) => (
            <div className="summary-row" key={item.product_id}>
              <span>{item.name} × {item.quantity}</span>
              <span>{formatPrice(item.price * item.quantity)}</span>
            </div>
          ))}
          <div className="summary-row"><span>Shipping</span><span>Complimentary</span></div>
          <div className="summary-row total"><span>To pay</span><span>{formatPrice(subtotal)}</span></div>
        </aside>
      </div>
    </div>
  );
}
