import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import { useCart } from '../contexts/CartContext';
import { fetchProduct } from '../lib/api';
import type { Product } from '../types';

export function ProductDetailPage() {
  const { id } = useParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const { addToCart } = useCart();

  useEffect(() => {
    if (!id) {
      return;
    }

    fetchProduct(Number(id)).then(setProduct);
  }, [id]);

  if (!product) {
    return <div className="container page-space">Loading product...</div>;
  }

  return (
    <div className="container page-space product-detail">
      <div className="product-gallery">
        <img src={product.image} alt={product.name} />
      </div>
      <div className="product-summary">
        <p className="eyebrow">Premium essentials</p>
        <h1>{product.name}</h1>
        <div className="product-price-row detail-price">
          <strong>${product.price}</strong>
          {product.compareAtPrice ? <span>${product.compareAtPrice}</span> : null}
        </div>
        <p>{product.description}</p>
        <div className="stock-status">{product.stockQuantity > 0 ? 'In stock' : 'Out of stock'}</div>
        <div className="quantity-row">
          <label htmlFor="quantity">Quantity</label>
          <input
            id="quantity"
            type="number"
            min={1}
            max={product.stockQuantity}
            value={quantity}
            onChange={(event) => setQuantity(Math.max(1, Number(event.target.value) || 1))}
          />
        </div>
        <div className="card-actions product-actions">
          <button type="button" className="primary-button" onClick={() => addToCart(product, quantity)}>
            Add to cart
          </button>
          <Link to="/shop" className="secondary-button">
            Continue shopping
          </Link>
        </div>
      </div>
    </div>
  );
}
