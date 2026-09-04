const BACKEND_BASE_URL = "http://localhost:5000";

function resolveImageUrl(src) {
  if (!src) return "";
  if (src.startsWith("http://") || src.startsWith("https://") || src.startsWith("data:")) {
    return src;
  }
  return `${BACKEND_BASE_URL}${src}`;
}

export default function ProductImage({ src, alt }) {
  const resolvedSrc = resolveImageUrl(src);

  if (!resolvedSrc) {
    return (
      <div style={{
        display: "grid",
        placeItems: "center",
        width: "100%",
        height: "100%",
        minHeight: 180,
        background: "#f3f4f6",
        color: "#6b7280",
        borderRadius: 12,
        fontSize: 14,
        fontWeight: 600,
      }}>
        No image
      </div>
    );
  }

  return (
    <img
      src={resolvedSrc}
      alt={alt}
      onError={(event) => {
        event.currentTarget.onerror = null;
        event.currentTarget.src = "";
        event.currentTarget.style.display = "none";
        event.currentTarget.parentElement.innerHTML = `
          <div style="
            display:grid; place-items:center; width:100%; height:100%; min-height:180px;
            background:#f3f4f6; color:#6b7280; border-radius:12px; font-size:14px; font-weight:600;
          ">
            No image
          </div>
        `;
      }}
    />
  );
}
