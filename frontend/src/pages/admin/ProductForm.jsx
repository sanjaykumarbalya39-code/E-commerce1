import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useToast } from "../../context/ToastContext";
import api from "../../services/api";

const blank = {
  name: "",
  description: "",
  price: "",
  stock: "",
  category: "Decor",
  image_url: "",
  featured: false,
};

export default function AdminProductForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { notify } = useToast();
  const [form, setForm] = useState(blank);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [error, setError] = useState("");
  const editing = Boolean(id);

  useEffect(() => {
    if (!id) return;
    api.get(`/products/${id}`).then(({ data }) => {
      const product = data.product;
      setForm({
        name: product.name,
        description: product.description,
        price: product.price,
        stock: product.stock,
        category: product.category,
        image_url: product.image_url,
        featured: product.featured,
      });
      if (product.image_url) {
        setPreview(`http://localhost:5000${product.image_url}`);
      }
    });
  }, [id]);

  const update = (event) => {
    const { name, value, type, checked } = event.target;
    setForm((current) => ({ ...current, [name]: type === "checkbox" ? checked : value }));
  };

  const handleFileChange = (event) => {
    const selected = event.target.files?.[0];
    if (!selected) {
      setFile(null);
      setPreview(form.image_url ? `http://localhost:5000${form.image_url}` : "");
      return;
    }

    setFile(selected);
    setPreview(URL.createObjectURL(selected));
  };

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    try {
      let imageUrl = form.image_url;

      if (file) {
        notify("Uploading image...", "ok");
        const formData = new FormData();
        formData.append("image", file);

        const uploadRes = await api.post("/upload", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });

        imageUrl = uploadRes.data.image_url;
      }

      const payload = { ...form, image_url: imageUrl };

      if (editing) {
        await api.put(`/admin/products/${id}`, payload);
        notify("Product updated");
      } else {
        await api.post("/admin/products", payload);
        notify("Product added");
      }
      navigate("/admin/products");
    } catch (err) {
      setError(err.message || "Upload failed. Try again.");
    }
  };

  return (
    <div>
      <div className="admin-head">
        <p className="eyebrow">Catalog</p>
        <h1>{editing ? "Edit product" : "New product"}</h1>
      </div>
      <form className="card auth-card form" onSubmit={submit} style={{ maxWidth: 640 }}>
        <label>Name <input name="name" value={form.name} onChange={update} required /></label>
        <label>Description <textarea name="description" value={form.description} onChange={update} required /></label>
        <label>Category <input name="category" value={form.category} onChange={update} required /></label>
        <label>Price (INR) <input name="price" type="number" value={form.price} onChange={update} required /></label>
        <label>Stock <input name="stock" type="number" value={form.stock} onChange={update} required /></label>
        <label>
          Product image
          <input type="file" accept="image/*" onChange={handleFileChange} required={!editing} />
        </label>
        {preview && (
          <div style={{ marginBottom: 12 }}>
            <img src={preview} alt="Preview" width="150" style={{ borderRadius: 8, objectFit: "cover" }} />
          </div>
        )}
        <label style={{ gridTemplateColumns: "auto 1fr", alignItems: "center" }}>
          <input type="checkbox" name="featured" checked={form.featured} onChange={update} />
          Featured on the home page
        </label>
        {error && <p className="error">{error}</p>}
        <button className="btn">{editing ? "Save changes" : "Create product"}</button>
      </form>
    </div>
  );
}
