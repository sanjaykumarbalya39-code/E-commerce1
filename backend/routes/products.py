from flask import Blueprint, jsonify, request

from models import Product

products_bp = Blueprint("products", __name__)


@products_bp.get("")
def list_products():
    query = Product.query
    search = (request.args.get("search") or "").strip()
    category = (request.args.get("category") or "").strip()
    featured = request.args.get("featured")

    if search:
        like = f"%{search}%"
        query = query.filter(
            db_or(Product.name.ilike(like), Product.description.ilike(like), Product.category.ilike(like))
        )
    if category and category.lower() != "all":
        query = query.filter(Product.category == category)
    if featured in ("1", "true", "True"):
        query = query.filter(Product.featured.is_(True))

    products = query.order_by(Product.featured.desc(), Product.created_at.desc()).all()
    return jsonify({"products": [p.to_dict() for p in products]})


def db_or(*clauses):
    from sqlalchemy import or_

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
