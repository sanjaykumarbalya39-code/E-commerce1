import { useEffect, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Pie,
  PieChart,
} from "recharts";
import api from "../../services/api";
import { formatPrice } from "../../utils/format";

const PIE_COLORS = ["#c45c26", "#3d5a4c", "#1a1410", "#c4a574", "#8d2e24"];

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api.get("/admin/stats").then(({ data }) => setStats(data));
  }, []);

  if (!stats) return <div className="loader" />;

  const statusData = Object.entries(stats.orders_by_status || {}).map(([name, value]) => ({
    name,
    value,
  }));

  return (
    <div>
      <div className="admin-head">
        <p className="eyebrow">House ledger</p>
        <h1>Dashboard</h1>
      </div>
      <div className="kpi-grid">
        <div className="card kpi"><span className="kicker">Revenue</span><b>{formatPrice(stats.kpis.revenue)}</b></div>
        <div className="card kpi"><span className="kicker">Orders</span><b>{stats.kpis.orders}</b></div>
        <div className="card kpi"><span className="kicker">Customers</span><b>{stats.kpis.customers}</b></div>
        <div className="card kpi"><span className="kicker">Low stock</span><b>{stats.kpis.low_stock}</b></div>
      </div>
      <div className="chart-grid">
        <div className="card chart-card">
          <div className="kicker">Revenue, last 14 days</div>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={stats.sales_trend}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(26,20,16,0.08)" />
              <XAxis dataKey="label" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip formatter={(value) => formatPrice(value)} />
              <Area type="monotone" dataKey="revenue" stroke="#c45c26" fill="#e7c3a8" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="card chart-card">
          <div className="kicker">Orders by status</div>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={statusData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80}>
                {statusData.map((entry, index) => (
                  <Cell key={entry.name} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="chart-grid">
        <div className="card chart-card">
          <div className="kicker">Top pieces</div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={stats.top_products}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(26,20,16,0.08)" />
              <XAxis dataKey="name" hide />
              <YAxis />
              <Tooltip />
              <Bar dataKey="sold" fill="#3d5a4c" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="card chart-card">
          <div className="kicker">Recent orders</div>
          {stats.recent_orders.map((order) => (
            <div className="summary-row" key={order.id}>
              <span>#{order.id} · {order.customer_name}</span>
              <span>{formatPrice(order.total)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
