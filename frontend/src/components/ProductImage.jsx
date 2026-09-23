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
      <div className="product-image-placeholder">
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
          <div class="product-image-placeholder">
            No image
          </div>
        `;
      }}
    />
  );
}
