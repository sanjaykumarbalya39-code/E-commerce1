import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";

export default function AdminLayout() {
  const { logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  return (
    <div className="admin-shell">
      <aside className="admin-side">
        <NavLink to="/" className="brand admin-brand">
          Velora
        </NavLink>
        <NavLink to="/admin" end>Dashboard</NavLink>
        <NavLink to="/admin/products">Products</NavLink>
        <NavLink to="/admin/orders">Orders</NavLink>
        <NavLink to="/shop">View store</NavLink>
        <button className="theme-toggle" onClick={toggleTheme} aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}>
          {theme === "light" ? "Moon mode" : "Sun mode"}
        </button>
        <button
          onClick={() => {
            logout();
            navigate("/login");
          }}
        >
          Sign out
        </button>
      </aside>
      <div className="admin-main">
        <Outlet />
      </div>
    </div>
  );
}
