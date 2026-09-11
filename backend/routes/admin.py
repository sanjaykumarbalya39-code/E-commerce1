from datetime import datetime, timedelta

from flask import Blueprint, jsonify, request
from sqlalchemy import func

from extensions import db
from models import Order, OrderItem, Product, User
from utils import admin_required, slugify

admin_bp = Blueprint("admin", __name__)
ALLOWED_STATUSES = {"pending", "processing", "shipped", "delivered", "cancelled"}


@admin_bp.get("/stats")
@admin_required
def stats():
    total_revenue = db.session.query(func.coalesce(func.sum(Order.total), 0)).scalar()
    order_count = Order.query.count()
    customer_count = User.query.filter_by(role="customer").count()
    product_count = Product.query.count()
    low_stock = Product.query.filter(Product.stock <= 5).count()

    status_rows = (
        db.session.query(Order.status, func.count(Order.id))
        .group_by(Order.status)
        .all()
    )
    orders_by_status = {status: count for status, count in status_rows}

    days = []
    today = datetime.utcnow().date()
    for offset in range(13, -1, -1):
        day = today - timedelta(days=offset)
        start = datetime.combine(day, datetime.min.time())
        end = start + timedelta(days=1)
        day_orders = Order.query.filter(Order.created_at >= start, Order.created_at < end).all()
        days.append(
            {
                "date": day.isoformat(),
                "label": day.strftime("%d %b"),
                "orders": len(day_orders),
                "revenue": round(sum(float(o.total) for o in day_orders), 2),
            }
        )

    top_rows = (
        db.session.query(
            OrderItem.product_name,
            func.sum(OrderItem.quantity).label("sold"),
            func.sum(OrderItem.quantity * OrderItem.unit_price).label("revenue"),
        )
        .group_by(OrderItem.product_name)
        .order_by(func.sum(OrderItem.quantity).desc())
        .limit(6)
        .all()
    )
    top_products = [
        {"name": name, "sold": int(sold or 0), "revenue": round(float(revenue or 0), 2)}
        for name, sold, revenue in top_rows
    ]

    recent = Order.query.order_by(Order.created_at.desc()).limit(6).all()

    return jsonify(
        {
            "kpis": {
                "revenue": round(float(total_revenue or 0), 2),
                "orders": order_count,
                "customers": customer_count,
                "products": product_count,
                "low_stock": low_stock,
            },
            "orders_by_status": orders_by_status,
            "sales_trend": days,
            "top_products": top_products,
            "recent_orders": [order.to_dict(include_items=False) for order in recent],
        }
    )


@admin_bp.get("/products")
@admin_required
def admin_products():
    products = Product.query.order_by(Product.created_at.desc()).all()
    return jsonify({"products": [p.to_dict() for p in products]})


@admin_bp.post("/products")
@admin_required
def create_product():
    data = request.get_json(silent=True) or {}
    error = _validate_product(data)
    if error:
        return jsonify({"error": error}), 400

    slug = slugify(data["name"])
    if Product.query.filter_by(slug=slug).first():
        slug = f"{slug}-{int(datetime.utcnow().timestamp())}"

    product = Product(
        name=data["name"].strip(),
        slug=slug,
        description=data["description"].strip(),
        price=data["price"],
        stock=int(data["stock"]),
        category=data["category"].strip(),
        image_url=data["image_url"].strip(),
        featured=bool(data.get("featured")),
    )
    db.session.add(product)
    db.session.commit()
    return jsonify({"product": product.to_dict()}), 201


@admin_bp.put("/products/<int:product_id>")
@admin_required
def update_product(product_id):
    product = Product.query.get_or_404(product_id)
    data = request.get_json(silent=True) or {}
    error = _validate_product(data)
    if error:
        return jsonify({"error": error}), 400

    product.name = data["name"].strip()
    product.description = data["description"].strip()
    product.price = data["price"]
    product.stock = int(data["stock"])
    product.category = data["category"].strip()
    product.image_url = data["image_url"].strip()
    product.featured = bool(data.get("featured"))
    db.session.commit()
    return jsonify({"product": product.to_dict()})


@admin_bp.delete("/products/<int:product_id>")
@admin_required
def delete_product(product_id):
    product = Product.query.get_or_404(product_id)
    db.session.delete(product)
    db.session.commit()
    return jsonify({"message": "Product deleted."})


@admin_bp.get("/orders")
@admin_required
def admin_orders():
    status = (request.args.get("status") or "").strip()
    page = max(request.args.get("page", 1, type=int) or 1, 1)
    limit = min(max(request.args.get("limit", 10, type=int) or 10, 1), 100)
    query = Order.query
    if status and status != "all":
        query = query.filter(Order.status == status)
    total = query.count()
    orders = (
        query.order_by(Order.created_at.desc())
        .limit(limit)
        .offset((page - 1) * limit)
        .all()
    )
    return jsonify(
        {
            "orders": [order.to_dict() for order in orders],
            "total": total,
            "page": page,
            "limit": limit,
            "total_pages": (total + limit - 1) // limit,
        }
    )


@admin_bp.patch("/orders/<int:order_id>/status")
@admin_required
def update_order_status(order_id):
    order = Order.query.get_or_404(order_id)
    data = request.get_json(silent=True) or {}
    status = (data.get("status") or "").strip().lower()
    if status not in ALLOWED_STATUSES:
        return jsonify({"error": "Invalid order status."}), 400
    order.status = status
    db.session.commit()
    return jsonify({"order": order.to_dict()})


def _validate_product(data):
    name = (data.get("name") or "").strip()
    description = (data.get("description") or "").strip()
    category = (data.get("category") or "").strip()
    image_url = (data.get("image_url") or "").strip()
    try:
        price = float(data.get("price"))
        stock = int(data.get("stock"))
    except (TypeError, ValueError):
        return "Price and stock must be numbers."
    if not name or not description or not category or not image_url:
        return "Name, description, category, and image URL are required."
    if price <= 0:
        return "Price must be greater than 0."
    if stock < 0:
        return "Stock cannot be negative."
    data["price"] = round(price, 2)
    data["stock"] = stock
    return None
