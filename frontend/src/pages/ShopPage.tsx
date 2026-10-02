import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import { useCart } from '../contexts/CartContext';
import { fetchProducts } from '../lib/api';
import type { Product } from '../types';

export function ShopPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('featured');
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart();

  useEffect(() => {
    fetchProducts()
      .then(setProducts)
      .finally(() => setLoading(false));
  }, []);

  const filteredProducts = useMemo(() => {
    const keyword = search.toLowerCase();
    const nextProducts = products.filter((product) => {
      const matchesSearch = product.name.toLowerCase().includes(keyword) || product.description.toLowerCase().includes(keyword);
      return matchesSearch;
    });

    switch (sort) {
      case 'price-low':
        return [...nextProducts].sort((a, b) => a.price - b.price);
      case 'price-high':
        return [...nextProducts].sort((a, b) => b.price - a.price);
      case 'rating':
        return [...nextProducts].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
      default:
        return [...nextProducts].sort((a, b) => Number(b.featured) - Number(a.featured));
    }
  }, [products, search, sort]);

  return (
    <div className="container page-space">
      <div className="section-heading inline-heading">
        <div>
          <p className="eyebrow">Shop</p>
          <h2>Curated essentials</h2>
        </div>
      </div>

      <div className="shop-toolbar">
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search products"
          aria-label="Search products"
        />
        <select value={sort} onChange={(event) => setSort(event.target.value)} aria-label="Sort products">
          <option value="featured">Featured</option>
          <option value="price-low">Price: low to high</option>
          <option value="price-high">Price: high to low</option>
          <option value="rating">Top rated</option>
        </select>
      </div>

      {loading ? (
        <div className="product-grid">
          {Array.from({ length: 8 }).map((_, index) => (
            <div className="product-card skeleton" key={index} />
          ))}
        </div>
      ) : (
        <div className="product-grid">
          {filteredProducts.map((product) => (
            <article key={product.id} className="product-card">
              <img src={product.image} alt={product.name} />
              <div className="product-body">
                <div className="product-meta">
                  <span>{product.stockQuantity > 0 ? 'In stock' : 'Out of stock'}</span>
                  <span>{product.rating ?? 5} ★</span>
                </div>
                <h3>{product.name}</h3>
                <p>{product.description}</p>
                <div className="product-price-row">
                  <strong>${product.price}</strong>
                  {product.compareAtPrice ? <span>${product.compareAtPrice}</span> : null}
                </div>
                <div className="card-actions">
                  <Link to={`/product/${product.id}`} className="secondary-button">Details</Link>
                  <button type="button" className="primary-button" onClick={() => addToCart(product, 1)}>
                    Add to cart
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
