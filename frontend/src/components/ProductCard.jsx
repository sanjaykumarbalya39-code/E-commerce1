import { Link } from "react-router-dom";
import ProductImage from "./ProductImage";
import { useCart } from "../context/CartContext";
import { useToast } from "../context/ToastContext";
import { formatPrice } from "../utils/format";

export default function ProductCard({ product }) {
  const { addItem } = useCart();
  const { notify } = useToast();
  const imageSrc = product?.image_url ? `http://localhost:5000${product.image_url}` : "";

  const handleAdd = async (event) => {
    event.preventDefault();
    try {
      await addItem(product, 1);
      notify(`${product.name} added to bag`);
    } catch (error) {
      notify(error.message, "err");
    }
  };

  return (
    <article className="card product-card">
      <Link to={`/product/${product.id}`}>
        <div className="thumb">
          <ProductImage src={imageSrc} alt={product.name} />
        </div>
        <div className="card-body">
          <div className="kicker">{product.category}</div>
          <h3>{product.name}</h3>
          <div className="card-actions">
            <span className="price">{formatPrice(product.price)}</span>
            {product.stock <= 5 && product.stock > 0 && (
              <span className="badge badge-warn">Low stock</span>
            )}
            {product.stock < 1 && <span className="badge">Sold out</span>}
          </div>
        </div>
      </Link>
      <div className="card-body" style={{ paddingTop: 0 }}>
        <button className="btn btn-sm" onClick={handleAdd} disabled={product.stock < 1}>
          Add to bag
        </button>
      </div>
    </article>
  );
}
