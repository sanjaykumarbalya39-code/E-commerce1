import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import ProductCard from "../components/ProductCard";
import Pagination from "../components/Pagination";
import { useDebounce } from "../hooks/useDebounce";
import api from "../services/api";

export default function Shop() {
  const [params, setParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const category = params.get("category") || "All";
  const [search, setSearch] = useState(params.get("search") || "");
  const debouncedSearch = useDebounce(search, 300);

  useEffect(() => {
    api.get("/products/categories").then(({ data }) => setCategories(data.categories));
  }, []);

  useEffect(() => {
    const loadProducts = async () => {
      setLoading(true);
      try {
        const { data } = await api.get("/products", {
          params: {
            page: currentPage,
            limit: 8,
            search: debouncedSearch || undefined,
            category: category !== "All" ? category : undefined,
          },
        });
        setProducts(data.products);
        setTotal(data.total);
        setTotalPages(data.total_pages);
      } finally {
        setLoading(false);
      }
    };
    loadProducts();
  }, [debouncedSearch, category, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, category]);

  const chips = useMemo(() => ["All", ...categories], [categories]);

  const setCategory = (value) => {
    const next = new URLSearchParams(params);
    if (value === "All") next.delete("category");
    else next.set("category", value);
    setParams(next);
  };

  return (
    <div className="container">
      <div className="page-head">
        <p className="eyebrow">The collection</p>
        <h1>Shop</h1>
      </div>
      <div className="filters">
        <input
          className="search"
          placeholder="Search oak, linen, brass…"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        {chips.map((item) => (
          <button
            key={item}
            className={`chip ${category === item ? "active" : ""}`}
            onClick={() => setCategory(item)}
          >
            {item}
          </button>
        ))}
      </div>
      {loading ? (
        <div className="loader" />
      ) : products.length === 0 ? (
        <div className="empty">Nothing matched that search. Try another material or room.</div>
      ) : (
        <>
          <p className="result-count">Showing {products.length} of {total} products</p>
          <div className="product-grid section">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
          <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
        </>
      )}
    </div>
  );
}
