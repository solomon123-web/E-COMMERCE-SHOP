import { Link, NavLink } from 'react-router-dom';

import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';

export function Navbar() {
  const { isAuthenticated, user, logout } = useAuth();
  const { itemCount } = useCart();

  return (
    <header className="site-header">
      <div className="container nav-shell">
        <Link to="/" className="brand" aria-label="Lumora home">
          <span className="brand-mark">L</span>
          Lumora
        </Link>

        <nav className="main-nav" aria-label="Main navigation">
          <NavLink to="/">Home</NavLink>
          <NavLink to="/shop">Shop</NavLink>
          <NavLink to="/cart">Cart</NavLink>
          {isAuthenticated && <NavLink to="/account">Account</NavLink>}
        </nav>

        <div className="nav-actions">
          <Link to="/cart" className="cart-pill" aria-label="Shopping cart">
            Cart <span>{itemCount}</span>
          </Link>

          {isAuthenticated ? (
            <>
              <span className="account-label">{user?.name ?? 'Member'}</span>
              <button type="button" className="secondary-button" onClick={logout}>
                Logout
              </button> 
            </>
          ) : (
            <>
              <Link to="/login" className="secondary-button">Login</Link>
              <Link to="/register" className="primary-button">Create account</Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
