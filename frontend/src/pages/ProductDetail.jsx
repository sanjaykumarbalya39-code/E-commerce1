import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import QuantityControl from "../components/QuantityControl";
import ProductImage from "../components/ProductImage";
import { useCart } from "../context/CartContext";
import { useToast } from "../context/ToastContext";
import api from "../services/api";
import { formatPrice } from "../utils/format";

export default function ProductDetail() {
  const { id } = useParams();
  const { addItem } = useCart();
  const { notify } = useToast();
  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [error, setError] = useState("");

  useEffect(() => {
    setError("");
    api
      .get(`/products/${id}`)
      .then(({ data }) => {
        setProduct(data.product);
        setQuantity(1);
      })
      .catch((err) => setError(err.message));
  }, [id]);

  if (error) return <div className="container empty">{error}</div>;
  if (!product) return <div className="container loader" />;

  const handleAdd = async () => {
    try {
      await addItem(product, quantity);
      notify(`${product.name} added to bag`);
    } catch (err) {
      notify(err.message, "err");
    }
  };

  return (
    <div className="container detail">
      <div className="detail-image">
        <ProductImage src={product.image_url} alt={product.name} />
      </div>
      <div>
        <p className="eyebrow">{product.category}</p>
        <h1>{product.name}</h1>
        <p className="price" style={{ fontSize: "1.4rem" }}>{formatPrice(product.price)}</p>
        <p className="lede">{product.description}</p>
        <p className="kicker" style={{ margin: "1.2rem 0" }}>
          {product.stock > 0 ? `${product.stock} in the atelier` : "Currently sold out"}
        </p>
        <div className="btn-row">
          <QuantityControl
            value={quantity}
            max={Math.max(1, product.stock)}
            onChange={setQuantity}
          />
          <button className="btn" onClick={handleAdd} disabled={product.stock < 1}>
            Add to bag
          </button>
          <Link className="btn btn-ghost" to="/cart">View bag</Link>
        </div>
      </div>
    </div>
  );
}
