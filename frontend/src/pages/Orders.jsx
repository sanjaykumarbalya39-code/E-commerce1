import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import { formatDate, formatPrice, statusLabel } from "../utils/format";

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/orders").then(({ data }) => setOrders(data.orders)).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="container loader" />;

  return (
    <div className="container">
      <div className="page-head">
        <p className="eyebrow">History</p>
        <h1>Orders</h1>
      </div>
      {orders.length === 0 ? (
        <div className="empty">No orders yet. The good plates are still on the shelf.</div>
      ) : (
        <div className="order-list">
          {orders.map((order) => (
            <Link key={order.id} to={`/orders/${order.id}`} className="card order-card">
              <header>
                <div>
                  <strong>Order #{order.id}</strong>
                  <div className="kicker">{formatDate(order.created_at)} · {order.item_count} items</div>
                </div>
                <span className={`badge badge-${order.status}`}>{statusLabel(order.status)}</span>
              </header>
              <p>{formatPrice(order.total)} · {order.city}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
