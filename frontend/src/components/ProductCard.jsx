import toast from 'react-hot-toast'

export default function ProductCard({ product, action, actionLabel, actionDisabled, detailsAction }) {
  return (
    <div className="product-card card">
      <div className="product-image">
        {product.image_url ? (
          <img src={product.image_url.startsWith('http') ? product.image_url : `http://127.0.0.1:8000${product.image_url}`} alt={product.title} />
        ) : (
          <div className="image-placeholder">Image</div>
        )}
        <div className="image-overlay">
          <button type="button" title="Add to wishlist" onClick={(e) => { e.stopPropagation(); toast.success('Added to wishlist!'); }}>
            ♥
          </button>
          <button type="button" title="Compare item" onClick={(e) => { e.stopPropagation(); toast.success('Added to compare!'); }}>
            ≋
          </button>
          <button type="button" title="Quick view" onClick={(e) => { e.stopPropagation(); detailsAction && detailsAction(); }}>
            ◯
          </button>
        </div>
      </div>
      <div className="product-card-body">
        <div className="card-header">
          <h3>{product.title}</h3>
          <div className="product-tags">
            {new Date() - new Date(product.created_at) < 1000 * 60 * 60 * 24 * 7 && (
              <span className="tag-new">New</span>
            )}
            {product.avg_rating >= 4.5 && (
              <span className="tag-hot">Best Seller</span>
            )}
            {product.status === 'open' && (
              <span className="tag-sale">Flash Sale</span>
            )}
          </div>
        </div>

        <div className="product-meta">
          {product.category && <span className="category-chip">{product.category.name}</span>}
          {product.avg_rating ? (
            <span className="product-rating">⭐ {product.avg_rating} ({product.review_count})</span>
          ) : (
            <span className="product-rating product-rating--empty">No reviews yet</span>
          )}
        </div>

        <p className="product-description">{product.description}</p>
        <div className="product-price">KSh{product.price.toLocaleString()}</div>
        <div className="product-quick-info">
          <span>{product.location}</span>
          <span>Seller: {product.created_by.username}</span>
          <span>{product.avg_rating ? `${product.avg_rating} ⭐` : 'No ratings yet'}</span>
        </div>

        <div className="button-row button-row-card">
          {detailsAction && (
            <button type="button" onClick={detailsAction} className="ghost">
              Details
            </button>
          )}
          <button onClick={action} disabled={actionDisabled}>{actionLabel}</button>
        </div>
      </div>
    </div>
  );
}
