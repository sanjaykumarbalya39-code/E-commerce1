import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="container empty">
      <h1 style={{ fontFamily: "var(--serif)", fontSize: "3rem" }}>Misplaced.</h1>
      <p>That page is not in the house.</p>
      <Link className="btn" to="/">Return home</Link>
    </div>
  );
}
