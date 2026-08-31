import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useToast } from "../../context/ToastContext";
import api from "../../services/api";
import { formatPrice } from "../../utils/format";

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const { notify } = useToast();

  const load = () => api.get("/admin/products").then(({ data }) => setProducts(data.products));

  useEffect(() => {
    load();
  }, []);

  const remove = async (id) => {
    if (!window.confirm("Remove this product from the catalog?")) return;
    try {
      await api.delete(`/admin/products/${id}`);
      notify("Product deleted");
      load();
    } catch (error) {
      notify(error.message, "err");
    }
  };

  return (
    <div>
      <div className="section-head">
        <div>
          <p className="eyebrow">Catalog</p>
          <h1>Products</h1>
        </div>
        <Link className="btn" to="/admin/products/new">Add product</Link>
      </div>
      <div className="card table-wrap">
        <table>
          <thead>
            <tr>
              <th>Piece</th>
              <th>Category</th>
              <th>Price</th>
              <th>Stock</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.id}>
                <td>
                  <strong>{product.name}</strong>
                  {product.featured ? <span className="badge" style={{ marginLeft: 8 }}>Featured</span> : null}
                </td>
                <td>{product.category}</td>
                <td>{formatPrice(product.price)}</td>
                <td>{product.stock}</td>
                <td>
                  <Link className="text-btn" to={`/admin/products/${product.id}/edit`}>Edit</Link>
                  {" · "}
                  <button className="text-btn" onClick={() => remove(product.id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
