from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required

from extensions import db
from models import CartItem, Product

cart_bp = Blueprint("cart", __name__)


def _current_user_id():
    return int(get_jwt_identity())


def _cart_payload(user_id):
    items = (
        CartItem.query.filter_by(user_id=user_id)
        .join(Product)
        .order_by(CartItem.id.desc())
        .all()
    )
    serialized = [item.to_dict() for item in items]
    subtotal = sum(item["price"] * item["quantity"] for item in serialized)
    count = sum(item["quantity"] for item in serialized)
    return {"items": serialized, "subtotal": round(subtotal, 2), "count": count}


@cart_bp.get("")
@jwt_required()
def get_cart():
    return jsonify(_cart_payload(_current_user_id()))


@cart_bp.post("")
@jwt_required()
def add_to_cart():
    data = request.get_json(silent=True) or {}
    product_id = data.get("product_id")
    quantity = int(data.get("quantity") or 1)
    if not product_id or quantity < 1:
        return jsonify({"error": "product_id and a positive quantity are required."}), 400

    product = db.session.get(Product, product_id)
    if not product:
        return jsonify({"error": "Product not found."}), 404
    if product.stock < 1:
        return jsonify({"error": "This product is out of stock."}), 400

    user_id = _current_user_id()
    item = CartItem.query.filter_by(user_id=user_id, product_id=product.id).first()
    next_qty = quantity if not item else item.quantity + quantity
    if next_qty > product.stock:
        return jsonify({"error": f"Only {product.stock} units available."}), 400

    if item:
        item.quantity = next_qty
    else:
        item = CartItem(user_id=user_id, product_id=product.id, quantity=quantity)
        db.session.add(item)

    db.session.commit()
    return jsonify(_cart_payload(user_id)), 201


@cart_bp.put("/<int:product_id>")
@jwt_required()
def update_cart_item(product_id):
    data = request.get_json(silent=True) or {}
    quantity = int(data.get("quantity") or 0)
    user_id = _current_user_id()
    item = CartItem.query.filter_by(user_id=user_id, product_id=product_id).first()
    if not item:
        return jsonify({"error": "Item not in cart."}), 404

    if quantity < 1:
        db.session.delete(item)
        db.session.commit()
        return jsonify(_cart_payload(user_id))

    if item.product and quantity > item.product.stock:
        return jsonify({"error": f"Only {item.product.stock} units available."}), 400

    item.quantity = quantity
    db.session.commit()
    return jsonify(_cart_payload(user_id))


@cart_bp.delete("/<int:product_id>")
@jwt_required()
def remove_cart_item(product_id):
    user_id = _current_user_id()
    item = CartItem.query.filter_by(user_id=user_id, product_id=product_id).first()
    if item:
        db.session.delete(item)
        db.session.commit()
    return jsonify(_cart_payload(user_id))


@cart_bp.delete("")
@jwt_required()
def clear_cart():
    user_id = _current_user_id()
    CartItem.query.filter_by(user_id=user_id).delete()
    db.session.commit()
    return jsonify(_cart_payload(user_id))


@cart_bp.post("/merge")
@jwt_required()
def merge_cart():
    data = request.get_json(silent=True) or {}
    incoming = data.get("items") or []
    user_id = _current_user_id()

    for row in incoming:
        product_id = row.get("product_id")
        quantity = int(row.get("quantity") or 0)
        if not product_id or quantity < 1:
            continue
        product = db.session.get(Product, product_id)
        if not product or product.stock < 1:
            continue
        item = CartItem.query.filter_by(user_id=user_id, product_id=product.id).first()
        merged_qty = min(product.stock, quantity if not item else item.quantity + quantity)
        if item:
            item.quantity = merged_qty
        else:
            db.session.add(
                CartItem(user_id=user_id, product_id=product.id, quantity=merged_qty)
            )

    db.session.commit()
    return jsonify(_cart_payload(user_id))
