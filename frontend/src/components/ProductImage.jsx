export default function ProductImage({ src, alt }) {
  return (
    <img
      src={src}
      alt={alt}
      onError={(event) => {
        event.currentTarget.onerror = null;
        event.currentTarget.src = "/placeholder.svg";
      }}
    />
  );
}
