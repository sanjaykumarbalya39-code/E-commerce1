# Task 12 — Write-up

**Project:** Velora e-commerce platform  
**Stack:** React + Flask + MySQL  
**New concept:** React Context API (global state)

## 1. What is the React Context API, and why did this project need it?

Context is React’s built-in way to share values with any descendant component without passing props through every layer. You create a context, wrap a tree in a `Provider`, and read it with `useContext` (here wrapped as `useAuth` / `useCart`).

A store cannot keep the cart on a single page. The header badge, product cards, product detail, cart, and checkout all need the same bag. Auth is the same problem: the navbar, protected routes, and admin layout all need the current user. Prop-drilling that through `App → Layout → Navbar → CartLink` is how those trees rot. Context is the foundation of that kind of shared state; Redux is optional later, not required here.

## 2. How does the cart actually move through the app?

`CartContext` keeps an `items` array in a **reducer**, not a scatter of `useState` calls:

- `ADD` — if the product is already in the bag, increase quantity (capped by stock)
- `UPDATE` — set quantity; `0` removes the line
- `REMOVE` / `CLEAR` / `SET`

**Guest:** reducer state is mirrored to `localStorage` (`velora_cart`) so a refresh does not empty the bag.

**Logged in:** every add/update/remove hits Flask (`/api/cart`). On login, any guest bag is `POST /api/cart/merge`’d into the user’s MySQL cart, then the server payload replaces local state. That is why you can browse as a guest and still keep the bag after you sign in.

Checkout does not re-send line items. Flask reads `cart_items` for that user, snapshots prices into `order_items`, decrements stock, and clears the cart in one transaction.

## 3. How is authentication done?

Passwords are stored as Werkzeug hashes. Login/register return a **JWT** (7-day expiry) with a `role` claim (`customer` or `admin`). The token sits in `localStorage` and Axios attaches `Authorization: Bearer …` on every request.

`AuthContext` hydrates on load with `GET /api/auth/me`. If the token is missing or dead, the user is signed out.

`ProtectedRoute` sends anonymous users to `/login`. The same component with `admin` sends non-admins home. Backend still enforces this: cart/orders need JWT; `/api/admin/*` uses an `admin_required` decorator that checks the JWT `role`. The UI guard is convenience; the API is the real lock.

## 4. Database design (short)

Five tables:

- `users` — name, email, password_hash, role
- `products` — catalog fields + stock + featured flag
- `cart_items` — `(user_id, product_id)` unique, quantity
- `orders` — status, total, shipping snapshot
- `order_items` — product name and unit price copied at purchase time so later catalog edits do not rewrite history

Relationships: a user has many cart lines and orders; an order has many items; items optionally still point at a product (`ON DELETE SET NULL`).

## 5. Admin panel and Recharts

Admins get `/admin` with three jobs: product CRUD, order status, and a dashboard. The dashboard calls `GET /api/admin/stats` and charts it with Recharts — area chart for 14-day revenue, pie for order statuses, bar for units sold. That is the same pattern as a sales dashboard, pointed at live order rows instead of mock JSON.

## 6. What I would change in production

- Store JWTs in httpOnly cookies, not `localStorage` (XSS can steal the token today)
- Add pagination on catalog and admin orders
- Take card payments; this checkout only captures an address
- Replace Unsplash URLs with uploaded assets
- Do not run `seed.py` against production — it drops tables

## 7. Challenges

- **Cart in two places.** Guest bag is client-only; logged-in bag is MySQL. Merge-on-login was the cleanest way to make Context feel instantaneous without losing the bag after refresh.
- **Stock.** The API rejects quantities above stock and decrements inventory only when the order is placed, so two tabs cannot oversell as easily as a client-only cart.
- **MySQL vs local setup.** SQLAlchemy URI is env-driven (`USE_SQLITE=1` fallback) so the same models run on MySQL 8 or SQLite.
