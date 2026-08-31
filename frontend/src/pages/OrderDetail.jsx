import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import ProductImage from "../components/ProductImage";
import api from "../services/api";
import { formatDate, formatPrice, statusLabel } from "../utils/format";

export default function OrderDetail() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get(`/orders/${id}`)
      .then(({ data }) => setOrder(data.order))
      .catch((err) => setError(err.message));
  }, [id]);

  if (error) return <div className="container empty">{error}</div>;
  if (!order) return <div className="container loader" />;

  return (
    <div className="container">
      <div className="page-head">
        <p className="eyebrow">Order #{order.id}</p>
        <h1>{statusLabel(order.status)}</h1>
        <p className="lede">{formatDate(order.created_at)} · {formatPrice(order.total)}</p>
      </div>
      <div className="checkout-layout">
        <div className="card">
          {order.items.map((item) => (
            <div className="line-item" key={item.id}>
              <ProductImage src={item.image_url} alt={item.product_name} />
              <div>
                <strong>{item.product_name}</strong>
                <p>{item.quantity} × {formatPrice(item.unit_price)}</p>
              </div>
              <span>{formatPrice(item.line_total)}</span>
            </div>
          ))}
        </div>
        <aside className="card summary">
          <h3>Deliver to</h3>
          <p>
            {order.customer_name}<br />
            {order.address}<br />
            {order.city} {order.pincode}<br />
            {order.phone}
          </p>
          <Link className="btn btn-ghost" to="/orders" style={{ marginTop: "1rem" }}>Back to orders</Link>
        </aside>
      </div>
    </div>
  );
}
