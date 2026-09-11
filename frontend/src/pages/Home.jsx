import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Pagination from "../components/Pagination";
import ProductCard from "../components/ProductCard";
import { useDebounce } from "../hooks/useDebounce";
import api from "../services/api";

const BACKEND_BASE_URL = "http://localhost:5000";

export default function Home() {
  const [featured, setFeatured] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);

  useEffect(() => {
    api.get("/products", {
      params: { featured: true, page: currentPage, limit: 8, search: debouncedSearch || undefined },
    }).then(({ data }) => {
      setFeatured(data.products);
      setTotal(data.total);
      setTotalPages(data.total_pages);
    });
  }, [currentPage, debouncedSearch]);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch]);

  return (
    <div className="container">
      <section className="hero">
        <div>
          <p className="eyebrow">Autumn edit / 2026</p>
          <h1>Quiet rooms, considered objects.</h1>
          <p className="lede">
            Furniture, light, linen, and tableware chosen for how they age — not how they photograph.
            A small house collection for people who keep the good plates for weeknights.
          </p>
          <div className="btn-row">
            <Link className="btn" to="/shop">Enter the shop</Link>
            <Link className="btn btn-ghost" to="/shop?category=Lighting">See the lighting</Link>
          </div>
        </div>
        <div className="hero-visual">
          <img
            src={`${BACKEND_BASE_URL}/static/uploads/oak-lounge-chair.jpg`}
            alt="Sunlit living room with oak furniture"
          />
          <div className="hero-chip">
            <div className="kicker">In the studio</div>
            <strong>Oak, linen, unlacquered brass</strong>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="section-head">
          <div>
            <p className="eyebrow">Featured</p>
            <h2>Pieces we keep around.</h2>
          </div>
          <Link to="/shop">View all</Link>
        </div>
        <input
          className="search"
          placeholder="Search featured products..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <p className="result-count">Showing {featured.length} of {total} products</p>
        <div className="product-grid">
          {featured.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
      </section>

      <section className="split">
        <img
          src={`${BACKEND_BASE_URL}/static/uploads/brass-table-lamp.jpg`}
          alt="Brass lamp on a walnut table"
        />
        <div className="split-copy">
          <p className="eyebrow" style={{ color: "#e7c3a8" }}>From the atelier</p>
          <h2>Light that earns the evening.</h2>
          <p>
            Unlacquered brass, paper shades, marble bases. Lamps meant to be left on while you cook,
            not hidden until guests arrive.
          </p>
          <Link className="btn" to="/shop?category=Lighting" style={{ marginTop: "1rem" }}>
            Shop lighting
          </Link>
        </div>
      </section>
    </div>
  );
}
