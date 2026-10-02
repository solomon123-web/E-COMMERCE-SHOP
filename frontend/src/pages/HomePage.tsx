import { Link } from 'react-router-dom';

import { useEffect, useState } from 'react';

import type { Product } from '../types';
import { fetchProducts } from '../lib/api';

const features = [
  { title: 'Free shipping', description: 'On orders over $150 across the continental U.S.' },
  { title: '2 year warranty', description: 'Protected on every order with premium support.' },
  { title: 'Easy returns', description: '30-day hassle-free return options on all essentials.' },
];

const categories = [
  'Audio',
  'Wearables',
  'Travel',
  'Home',
  'Accessories',
  'Photography',
];

export function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts()
      .then((items) => setProducts(items.slice(0, 4)))
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <section className="hero-section">
        <div className="container hero-layout">
          <div className="hero-copy">
            <p className="eyebrow">Built for everyday life</p>
            <h1>Premium essentials for modern living.</h1>
            <p className="hero-text">
              Discover elevated gear, smart accessories, and refined everyday products that simplify how you move, work, and play.
            </p>
            <div className="hero-actions">
              <Link to="/shop" className="primary-button">Shop now</Link>
              <Link to="/account" className="secondary-button">View account</Link>
            </div>
            <ul className="hero-metrics">
              <li><strong>10k+</strong><span>happy customers</span></li>
              <li><strong>4.9/5</strong><span>average rating</span></li>
              <li><strong>48h</strong><span>dispatch time</span></li>
            </ul>
          </div>
          <div className="hero-card">
            <img
              src="https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=900&q=80"
              alt="Featured smart watch"
            />
          </div>
        </div>
      </section>

      <section className="section-block">
        <div className="container">
          <div className="section-heading">
            <p className="eyebrow">Popular categories</p>
            <h2>Shop by lifestyle</h2>
          </div>
          <div className="category-grid">
            {categories.map((category, index) => (
              <div key={category} className="category-card">
                <span>{index + 1}</span>
                <h3>{category}</h3>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section-block muted-block">
        <div className="container">
          <div className="section-heading">
            <p className="eyebrow">Featured products</p>
            <h2>Best sellers this week</h2>
          </div>

          {loading ? (
            <div className="product-grid">
              {Array.from({ length: 4 }).map((_, index) => (
                <div className="product-card skeleton" key={index} />
              ))}
            </div>
          ) : (
            <div className="product-grid">
              {products.map((product) => (
                <article key={product.id} className="product-card">
                  <img src={product.image} alt={product.name} />
                  <div className="product-body">
                    <div className="product-meta">
                      <span>{product.categoryId}</span>
                      <span>{product.rating ?? 4.8} ★</span>
                    </div>
                    <h3>{product.name}</h3>
                    <p>{product.description}</p>
                    <div className="product-price-row">
                      <strong>${product.price}</strong>
                      {product.compareAtPrice ? <span>${product.compareAtPrice}</span> : null}
                    </div>
                    <Link to={`/product/${product.id}`} className="secondary-button full-width">
                      View product
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="section-block">
        <div className="container benefit-grid">
          {features.map((feature) => (
            <div key={feature.title} className="benefit-card">
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="section-block promo-panel">
        <div className="container promo-layout">
          <div>
            <p className="eyebrow">Limited offer</p>
            <h2>Save up to 30% on smart home essentials.</h2>
          </div>
          <Link to="/shop" className="primary-button">Explore the collection</Link>
        </div>
      </section>

      <section className="section-block muted-block">
        <div className="container testimonial-grid">
          <blockquote>
            “The quality feels premium and the shipping was faster than promised. It feels like a true luxury brand.”
            <footer>— Aisha K.</footer>
          </blockquote>
          <blockquote>
            “Our home office setup feels complete thanks to Lumora. Beautiful design, excellent support.”
            <footer>— Mark T.</footer>
          </blockquote>
          <blockquote>
            “Everything I’ve purchased has been thoughtfully designed and built to last.”
            <footer>— Zoe R.</footer>
          </blockquote>
        </div>
      </section>

      <section className="newsletter-wrap">
        <div className="container newsletter-box">
          <div>
            <p className="eyebrow">Stay in the loop</p>
            <h2>Enjoy new arrivals, exclusive offers, and product launches.</h2>
          </div>
          <form className="newsletter-form">
            <input type="email" placeholder="Enter your email" aria-label="Email address" />
            <button type="submit" className="primary-button">Join now</button>
          </form>
        </div>
      </section>
    </>
  );
}
