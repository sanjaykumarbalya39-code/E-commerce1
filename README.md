# Velora — E-Commerce Platform

Full-stack shop for Task 12: a customer store and an admin panel, built with **React**, **Flask**, and **MySQL**. Shared cart and session state live in the **React Context API**, so the bag count, add-to-cart actions, and auth status stay in sync without prop drilling.

## What you can do

**Customers**
- Browse and search the catalog, open a product, add it to the bag
- Change quantity or remove lines in the cart
- Register / log in, check out with a shipping address, place an order
- Read order history and a single order’s status

**Admins**
- Dashboard with Recharts (revenue trend, orders by status, top products)
- Add, edit, and delete products
- View every order and update status (`pending` → `processing` → `shipped` → `delivered`, or `cancelled`)

## Tech stack

| Layer | Tools |
|---|---|
| Frontend | React 19, Vite, React Router, Axios, Context API, Recharts |
| Backend | Flask, Flask-SQLAlchemy, Flask-JWT-Extended, Flask-CORS |
| Database | MySQL 8 (SQLite fallback if you set `USE_SQLITE=1`) |

## Folder structure

```
E-commerce-platform/
├── backend/
│   ├── app.py              # Flask factory + blueprints
│   ├── config.py
│   ├── models.py           # User, Product, CartItem, Order, OrderItem
│   ├── seed.py             # Creates DB, tables, catalog, demo users
│   ├── schema.sql          # Reference MySQL schema
│   ├── routes/             # auth, products, cart, orders, admin
│   └── requirements.txt
└── frontend/
    └── src/
        ├── context/        # AuthContext + CartContext (the new concept)
        ├── pages/          # Store + admin screens
        ├── components/
        └── services/api.js
```

## Setup

### 1. MySQL (assignment default)

Create a user that can create databases, then in `backend/.env`:

```
MYSQL_USER=root
MYSQL_PASSWORD=your_mysql_root_password
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_DB=velora_shop
USE_SQLITE=0
```

`seed.py` will create `velora_shop` if it does not exist.

### 2. Backend

```bash
cd backend
pip install -r requirements.txt
copy .env.example .env   # Windows; then edit MYSQL_PASSWORD
python seed.py
python app.py
```

API: [http://localhost:5000/api/health](http://localhost:5000/api/health)

### 3. Frontend

```bash
cd frontend
npm install
copy .env.example .env
npm run dev
```

App: [http://localhost:5173](http://localhost:5173)

### SQLite fallback

If MySQL is not available, set `USE_SQLITE=1` in `backend/.env` and run `python seed.py` again. The rest of the app is unchanged — SQLAlchemy talks to either engine.

## Demo accounts

| Role | Email | Password |
|---|---|---|
| Customer | `demo@velora.test` | `Demo@123` |
| Admin | `admin@velora.test` | `Admin@123` |

`seed.py` wipes and rebuilds the database. Do not run it against a database you care about.

## API map

| Method | Path | Who |
|---|---|---|
| POST | `/api/auth/register` | Public |
| POST | `/api/auth/login` | Public |
| GET | `/api/auth/me` | JWT |
| GET | `/api/products` | Public (`search`, `category`, `featured`) |
| GET | `/api/products/<id>` | Public |
| GET | `/api/products/categories` | Public |
| GET/POST/DELETE | `/api/cart` | JWT |
| PUT/DELETE | `/api/cart/<product_id>` | JWT |
| POST | `/api/cart/merge` | JWT (guest bag → server bag) |
| POST | `/api/orders` | JWT checkout |
| GET | `/api/orders` | JWT own history |
| GET | `/api/admin/stats` | Admin |
| POST/PUT/DELETE | `/api/admin/products` | Admin |
| GET | `/api/admin/orders` | Admin |
| PATCH | `/api/admin/orders/<id>/status` | Admin |

## Context API (what this task is about)

- `AuthContext` holds `user`, `token`, `login`, `register`, `logout`. Any page can call `useAuth()` instead of threading props through the navbar, checkout, and admin guard.
- `CartContext` uses `useReducer` for add / update / remove / clear. Guests persist the bag in `localStorage`. After login, the bag is merged into MySQL via `/api/cart/merge`, then the server is the source of truth.
- The navbar badge, product cards, cart page, and checkout all read the same context — that is the whole point of skipping prop drilling.

## Screen recording notes

Record: register or demo login → shop → add to bag → change qty → checkout → order history → admin login → add/edit a product → change an order status → dashboard charts.
