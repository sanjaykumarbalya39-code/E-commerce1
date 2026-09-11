from flask import Blueprint, jsonify, request
from sqlalchemy import or_

from models import Product

products_bp = Blueprint("products", __name__)


@products_bp.get("")
def list_products():
    query = Product.query
    search = (request.args.get("search") or "").strip()
    category = (request.args.get("category") or "").strip()
    featured = request.args.get("featured")
    page = max(request.args.get("page", 1, type=int) or 1, 1)
    limit = min(max(request.args.get("limit", 8, type=int) or 8, 1), 100)
    sort = (request.args.get("sort") or "").strip().lower()

    if search:
        like = f"%{search}%"
        query = query.filter(
            db_or(Product.name.ilike(like), Product.description.ilike(like), Product.category.ilike(like))
        )
    if category and category.lower() != "all":
        query = query.filter(Product.category == category)
    if featured in ("1", "true", "True"):
        query = query.filter(Product.featured.is_(True))

    total = query.count()
    sort_columns = {
        "name": Product.name.asc(),
        "price_asc": Product.price.asc(),
        "price_desc": Product.price.desc(),
        "oldest": Product.created_at.asc(),
    }
    order = sort_columns.get(sort)
    if order is None:
        order = Product.featured.desc(), Product.created_at.desc()
    else:
        order = (order,)

    products = query.order_by(*order).limit(limit).offset((page - 1) * limit).all()
    return jsonify(
        {
            "products": [p.to_dict() for p in products],
            "total": total,
            "page": page,
            "limit": limit,
            "total_pages": (total + limit - 1) // limit,
        }
    )


def db_or(*clauses):
    return or_(*clauses)


@products_bp.get("/categories")
def categories():
    rows = (
        Product.query.with_entities(Product.category)
        .distinct()
        .order_by(Product.category.asc())
        .all()
    )
    return jsonify({"categories": [row[0] for row in rows]})


@products_bp.get("/<int:product_id>")
def get_product(product_id):
    product = Product.query.get_or_404(product_id)
    return jsonify({"product": product.to_dict()})
