import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { useTheme } from "../context/ThemeContext";

function initials(name) {
  return (name || "?").trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
}

function avatarSource(url) {
  if (!url) return "";
  return url.startsWith("http") ? url : `http://${window.location.hostname}:5000${url}`;
}

export default function StoreLayout() {
  const { user, logout, isAdmin } = useAuth();
  const { count } = useCart();
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="page-shell">
      <div className="announcement">Complimentary shipping on orders over ₹2,000 · Made to be lived with</div>
      <header>
        <div className="container nav">
          <NavLink to="/" className="brand">Velora</NavLink>
          <nav className="nav-links">
            <NavLink to="/" end>Home</NavLink>
            <NavLink to="/shop">Shop</NavLink>
            {user && <NavLink to="/orders">Orders</NavLink>}
            {isAdmin && <NavLink to="/admin">Admin</NavLink>}
          </nav>
          <div className="nav-actions">
            <button className="theme-toggle" onClick={toggleTheme} aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}>
              {theme === "light" ? "Moon" : "Sun"}
            </button>
            {user ? (
              <>
                <NavLink to="/profile" className="profile-nav" aria-label="My Profile">
                  {user.avatar_url ? (
                    <img src={avatarSource(user.avatar_url)} alt="" className="nav-avatar" />
                  ) : (
                    <span className="nav-avatar nav-avatar-initials" aria-hidden="true">{initials(user.name)}</span>
                  )}
                  <span>My Profile</span>
                </NavLink>
                <button className="text-btn" onClick={logout}>Sign out</button>
              </>
            ) : (
              <NavLink to="/login">Sign in</NavLink>
            )}
            <NavLink to="/cart" className="cart-link">
              Bag
              {count > 0 && <span className="cart-count">{count}</span>}
            </NavLink>
          </div>
        </div>
      </header>
      <main>
        <Outlet />
      </main>
      <footer className="container footer">
        <div>
          <strong>Velora</strong>
          Objects for slower rooms — furniture, light, linen, and the small things that make a house feel finished.
        </div>
        <div>
          <strong>Visit</strong>
          14, Maple Lane<br />Bengaluru 560001
        </div>
        <div>
          <strong>Hours</strong>
          Tue–Sun, 11–7<br />hello@velora.test
        </div>
      </footer>
    </div>
  );
}
