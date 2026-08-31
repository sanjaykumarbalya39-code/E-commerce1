"""Create the MySQL database, tables, and demo catalog."""
from datetime import datetime, timedelta
from urllib.parse import quote_plus

from sqlalchemy import create_engine, text
from werkzeug.security import generate_password_hash

from app import app
from config import Config
from extensions import db
from models import CartItem, Order, OrderItem, Product, User
from utils import slugify

CATALOG = [
    {
        "name": "Oak Lounge Chair",
        "category": "Furniture",
        "price": 24990,
        "stock": 12,
        "featured": True,
        "image_url": "https://images.unsplash.com/photo-1592078615290-033ee584e267?auto=format&fit=crop&w=1200&q=80",
        "description": "A low, sculptural lounge chair in white-oak plywood with a linen sling. Built for long evenings, not showrooms.",
    },
    {
        "name": "Linen Throw Pillow",
        "category": "Decor",
        "price": 1890,
        "stock": 40,
        "featured": True,
        "image_url": "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1200&q=80",
        "description": "Stonewashed European linen, hidden zipper, feather-down fill. Softens a sofa without shouting for attention.",
    },
    {
        "name": "Ceramic Pour-Over Set",
        "category": "Kitchen",
        "price": 4290,
        "stock": 22,
        "featured": True,
        "image_url": "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=1200&q=80",
        "description": "Hand-glazed dripper and 600ml carafe. The glaze pools thicker at the rim so every pour looks considered.",
    },
    {
        "name": "Brass Table Lamp",
        "category": "Lighting",
        "price": 8790,
        "stock": 16,
        "featured": True,
        "image_url": "https://images.unsplash.com/photo-1540932239986-30128078f3c5?auto=format&fit=crop&w=1200&q=80",
        "description": "Unlacquered brass that will patina with your rooms. Linen shade, dimmable, 40W equivalent LED included.",
    },
    {
        "name": "Wool Area Rug",
        "category": "Decor",
        "price": 18990,
        "stock": 8,
        "featured": False,
        "image_url": "https://images.unsplash.com/photo-1554995207-c18c203602cb?auto=format&fit=crop&w=1200&q=80",
        "description": "Hand-tufted New Zealand wool in a quiet oatmeal field. 5×8 ft, cotton backing, made to live with sand and socks.",
    },
    {
        "name": "Walnut Side Table",
        "category": "Furniture",
        "price": 12990,
        "stock": 10,
        "featured": False,
        "image_url": "https://images.unsplash.com/photo-1532372320572-cda25653a26d?auto=format&fit=crop&w=1200&q=80",
        "description": "Solid American walnut, oil finish, a single drawer for the remote you pretend you do not use.",
    },
    {
        "name": "Hand-Thrown Vase",
        "category": "Decor",
        "price": 3490,
        "stock": 18,
        "featured": True,
        "image_url": "https://images.unsplash.com/photo-1578500494198-246f612d3b3d?auto=format&fit=crop&w=1200&q=80",
        "description": "Stoneware thrown in Jaipur, ash glaze, slight wobble at the neck. Holds branches, not just supermarket roses.",
    },
    {
        "name": "Linen Duvet Cover",
        "category": "Home",
        "price": 9990,
        "stock": 20,
        "featured": False,
        "image_url": "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=1200&q=80",
        "description": "Queen size, garment-washed flax linen that starts lived-in. Coconut buttons, envelope closure, gets better every wash.",
    },
    {
        "name": "Stoneware Dinner Set",
        "category": "Kitchen",
        "price": 7490,
        "stock": 14,
        "featured": False,
        "image_url": "https://images.unsplash.com/photo-1577375729152-4c8b5fcda381?auto=format&fit=crop&w=1200&q=80",
        "description": "Sixteen-piece set in warm clay. Microwave-safe, slightly irregular rims, the kind of plates guests ask about.",
    },
    {
        "name": "Scented Soy Candle",
        "category": "Wellness",
        "price": 1290,
        "stock": 50,
        "featured": True,
        "image_url": "https://images.pexels.com/photos/278664/pexels-photo-278664.jpeg?auto=compress&cs=tinysrgb&w=1200",
        "description": "Fig leaf, cedar, a little smoke. 55-hour burn in a reusable tumbler you will keep for pencils.",
    },
    {
        "name": "Cotton Bath Towel Set",
        "category": "Home",
        "price": 3990,
        "stock": 28,
        "featured": False,
        "image_url": "https://images.unsplash.com/photo-1583947581924-860bda6a26df?auto=format&fit=crop&w=1200&q=80",
        "description": "Four-piece long-staple cotton. Heavy without being stiff, dyed in mineral clay, loops that stay loops.",
    },
    {
        "name": "Arc Floor Lamp",
        "category": "Lighting",
        "price": 16490,
        "stock": 7,
        "featured": False,
        "image_url": "https://images.unsplash.com/photo-1543198126-a8ad8e47fb22?auto=format&fit=crop&w=1200&q=80",
        "description": "A marble base and a steel arc that clears a sofa. Paper shade, warm 2700K, footprint smaller than it looks.",
    },
    {
        "name": "Marble Serving Board",
        "category": "Kitchen",
        "price": 2790,
        "stock": 24,
        "featured": False,
        "image_url": "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=1200&q=80",
        "description": "Makrana marble with a leather strap. Cheese, citrus, or a stack of mail — it earns the counter.",
    },
    {
        "name": "Rattan Storage Basket",
        "category": "Decor",
        "price": 2190,
        "stock": 30,
        "featured": False,
        "image_url": "https://images.unsplash.com/photo-1611486212557-88be5ff6f941?auto=format&fit=crop&w=1200&q=80",
        "description": "Open-weave cane with leather handles. Throws, toys, unread New Yorkers — finally a place that looks intentional.",
    },
    {
        "name": "Essential Oil Diffuser",
        "category": "Wellness",
        "price": 4590,
        "stock": 19,
        "featured": False,
        "image_url": "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=1200&q=80",
        "description": "Ultrasonic, matte ceramic shell, 8-hour run. Quiet enough for a bedside, handsome enough for a desk.",
    },
    {
        "name": "Cashmere Throw",
        "category": "Home",
        "price": 11990,
        "stock": 9,
        "featured": True,
        "image_url": "https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?auto=format&fit=crop&w=1200&q=80",
        "description": "Grade-A cashmere, 130×180 cm, whip-stitched edge. The piece you move from bed to sofa to airplane.",
    },
    {
        "name": "Matte Black Cutlery",
        "category": "Kitchen",
        "price": 5490,
        "stock": 21,
        "featured": False,
        "image_url": "https://images.unsplash.com/photo-1610701596007-11502861dcfa?auto=format&fit=crop&w=1200&q=80",
        "description": "24-piece PVD-coated stainless. Weighted handles, dishwasher-safe, looks like you hired a stylist.",
    },
    {
        "name": "Botanical Print Set",
        "category": "Decor",
        "price": 3290,
        "stock": 26,
        "featured": False,
        "image_url": "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=1200&q=80",
        "description": "Three archival prints of Himalayan flora, 30×40 cm, unframed so you can choose the oak or the black.",
    },
]


def ensure_database():
    if Config.USE_SQLITE:
        return
    user = quote_plus(Config.MYSQL_USER)
    password = quote_plus(Config.MYSQL_PASSWORD)
    host = Config.MYSQL_HOST
    port = Config.MYSQL_PORT
    name = Config.MYSQL_DB
    engine = create_engine(
        f"mysql+pymysql://{user}:{password}@{host}:{port}/?charset=utf8mb4",
        pool_pre_ping=True,
    )
    with engine.connect() as conn:
        conn.execute(
            text(
                f"CREATE DATABASE IF NOT EXISTS `{name}` "
                "CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"
            )
        )
        conn.commit()
    engine.dispose()


def seed():
    ensure_database()
    with app.app_context():
        db.drop_all()
        db.create_all()

        admin = User(
            name="Velora Admin",
            email="admin@velora.test",
            password_hash=generate_password_hash("Admin@123"),
            role="admin",
        )
        demo = User(
            name="Aanya Mehra",
            email="demo@velora.test",
            password_hash=generate_password_hash("Demo@123"),
            role="customer",
        )
        guest = User(
            name="Rohan Iyer",
            email="rohan@velora.test",
            password_hash=generate_password_hash("Rohan@123"),
            role="customer",
        )
        db.session.add_all([admin, demo, guest])
        db.session.flush()

        products = []
        for row in CATALOG:
            products.append(
                Product(
                    name=row["name"],
                    slug=slugify(row["name"]),
                    description=row["description"],
                    price=row["price"],
                    stock=row["stock"],
                    category=row["category"],
                    image_url=row["image_url"],
                    featured=row["featured"],
                )
            )
        db.session.add_all(products)
        db.session.flush()

        now = datetime.utcnow()
        sample_orders = [
            (demo, 11, "delivered", 3, [(0, 1), (9, 2)]),
            (demo, 8, "shipped", 1, [(3, 1)]),
            (demo, 2, "processing", 0, [(7, 1), (10, 1)]),
            (guest, 10, "delivered", 6, [(15, 1)]),
            (guest, 6, "delivered", 4, [(2, 1), (9, 1)]),
            (guest, 4, "shipped", 2, [(4, 1)]),
            (guest, 1, "pending", 0, [(11, 1), (13, 2)]),
            (demo, 13, "cancelled", 9, [(17, 1)]),
        ]

        for buyer, days_ago, status, hour, lines in sample_orders:
            created = now - timedelta(days=days_ago, hours=hour)
            items = []
            total = 0
            for index, qty in lines:
                product = products[index]
                total += float(product.price) * qty
                items.append((product, qty))
            order = Order(
                user_id=buyer.id,
                status=status,
                total=round(total, 2),
                customer_name=buyer.name,
                phone="9876543210" if buyer is demo else "9123456780",
                address="14, Maple Lane" if buyer is demo else "88, Marine Drive",
                city="Bengaluru" if buyer is demo else "Mumbai",
                pincode="560001" if buyer is demo else "400001",
                created_at=created,
            )
            db.session.add(order)
            db.session.flush()
            for product, qty in items:
                db.session.add(
                    OrderItem(
                        order_id=order.id,
                        product_id=product.id,
                        product_name=product.name,
                        unit_price=product.price,
                        quantity=qty,
                    )
                )
                if status != "cancelled":
                    product.stock = max(0, product.stock - qty)

        db.session.add(CartItem(user_id=demo.id, product_id=products[5].id, quantity=1))
        db.session.commit()

        print("Seed complete.")
        print("  Admin    : admin@velora.test / Admin@123")
        print("  Customer : demo@velora.test  / Demo@123")
        print(f"  Products : {len(products)}")
        print(f"  Orders   : {Order.query.count()}")


if __name__ == "__main__":
    seed()
