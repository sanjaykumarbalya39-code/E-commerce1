import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";

export default function StoreLayout() {
  const { user, logout, isAdmin } = useAuth();
  const { count } = useCart();

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
            {user ? (
              <button className="text-btn" onClick={logout}>
                Sign out
              </button>
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
