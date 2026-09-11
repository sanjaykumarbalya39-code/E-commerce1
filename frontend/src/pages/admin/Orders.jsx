import { useEffect, useState } from "react";
import { useToast } from "../../context/ToastContext";
import Pagination from "../../components/Pagination";
import api from "../../services/api";
import { formatDate, formatPrice, statusLabel } from "../../utils/format";

const STATUSES = ["pending", "processing", "shipped", "delivered", "cancelled"];

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [status, setStatus] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const { notify } = useToast();

  const load = () =>
    api.get("/admin/orders", { params: { status, page: currentPage, limit: 10 } }).then(({ data }) => {
      setOrders(data.orders);
      setTotalPages(data.total_pages);
    });

  useEffect(() => {
    load();
  }, [status, currentPage]);

  const updateStatus = async (id, next) => {
    try {
      await api.patch(`/admin/orders/${id}/status`, { status: next });
      notify("Order updated");
      load();
    } catch (error) {
      notify(error.message, "err");
    }
  };

  return (
    <div>
      <div className="section-head">
        <div>
          <p className="eyebrow">Fulfillment</p>
          <h1>Orders</h1>
        </div>
        <select
          value={status}
          onChange={(event) => {
            setStatus(event.target.value);
            setCurrentPage(1);
          }}
        >
          <option value="all">All statuses</option>
          {STATUSES.map((item) => (
            <option key={item} value={item}>{statusLabel(item)}</option>
          ))}
        </select>
      </div>
      <div className="card table-wrap">
        <table>
          <thead>
            <tr>
              <th>Order</th>
              <th>Customer</th>
              <th>Total</th>
              <th>Date</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id}>
                <td>#{order.id}</td>
                <td>
                  {order.customer_name}
                  <div className="kicker">{order.city}</div>
                </td>
                <td>{formatPrice(order.total)}</td>
                <td>{formatDate(order.created_at)}</td>
                <td>
                  <select value={order.status} onChange={(event) => updateStatus(order.id, event.target.value)}>
                    {STATUSES.map((item) => (
                      <option key={item} value={item}>{statusLabel(item)}</option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
    </div>
  );
}
