from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required

from extensions import db
from models import CartItem, Order, OrderItem, Product

orders_bp = Blueprint("orders", __name__)


@orders_bp.post("")
@jwt_required()
def place_order():
    data = request.get_json(silent=True) or {}
    user_id = int(get_jwt_identity())

    customer_name = (data.get("customer_name") or "").strip()
    phone = (data.get("phone") or "").strip()
    address = (data.get("address") or "").strip()
    city = (data.get("city") or "").strip()
    pincode = (data.get("pincode") or "").strip()

    if not all([customer_name, phone, address, city, pincode]):
        return jsonify({"error": "All shipping fields are required."}), 400

    cart_items = CartItem.query.filter_by(user_id=user_id).all()
    if not cart_items:
        return jsonify({"error": "Your cart is empty."}), 400

    total = 0
    prepared = []
    for item in cart_items:
        product = item.product
        if not product:
            return jsonify({"error": "A cart item is no longer available."}), 400
        if item.quantity > product.stock:
            return jsonify(
                {"error": f"{product.name} only has {product.stock} units left."}
            ), 400
        line = float(product.price) * item.quantity
        total += line
        prepared.append((product, item.quantity, float(product.price)))

    order = Order(
        user_id=user_id,
        status="pending",
        total=round(total, 2),
        customer_name=customer_name,
        phone=phone,
        address=address,
        city=city,
        pincode=pincode,
    )
    db.session.add(order)
    db.session.flush()

    for product, quantity, unit_price in prepared:
        db.session.add(
            OrderItem(
                order_id=order.id,
                product_id=product.id,
                product_name=product.name,
                unit_price=unit_price,
                quantity=quantity,
            )
        )
        product.stock -= quantity

    CartItem.query.filter_by(user_id=user_id).delete()
    db.session.commit()
    return jsonify({"order": order.to_dict()}), 201


@orders_bp.get("")
@jwt_required()
def my_orders():
    user_id = int(get_jwt_identity())
    orders = (
        Order.query.filter_by(user_id=user_id)
        .order_by(Order.created_at.desc())
        .all()
    )
    return jsonify({"orders": [order.to_dict() for order in orders]})


@orders_bp.get("/<int:order_id>")
@jwt_required()
def get_order(order_id):
    user_id = int(get_jwt_identity())
    order = Order.query.filter_by(id=order_id, user_id=user_id).first()
    if not order:
        return jsonify({"error": "Order not found."}), 404
    return jsonify({"order": order.to_dict()})
