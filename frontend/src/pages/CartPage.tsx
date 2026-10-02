import { Link } from 'react-router-dom';

import { useCart } from '../contexts/CartContext';

export function CartPage() {
  const { items, subtotal, removeFromCart, updateQuantity, clearCart } = useCart();
  const shipping = subtotal > 150 ? 0 : 14.99;
  const total = subtotal + shipping;

  if (!items.length) {
    return (
      <div className="container page-space empty-state-box">
        <h2>Your cart is empty</h2>
        <p>Browse our essentials and add a few favorites to get started.</p>
        <Link to="/shop" className="primary-button">Shop now</Link>
      </div>
    );
  }

  return (
    <div className="container page-space cart-layout">
      <section className="cart-list">
        <div className="section-heading inline-heading">
          <div>
            <p className="eyebrow">Your cart</p>
            <h2>{items.length} items</h2>
          </div>
          <button type="button" className="text-button" onClick={clearCart}>Clear cart</button>
        </div>

        {items.map((item) => (
          <div className="cart-item" key={item.productId}>
            <img src={item.image} alt={item.name} />
            <div className="cart-item-details">
              <h3>{item.name}</h3>
              <p>${item.price} each</p>
              <div className="quantity-card">
                <button type="button" onClick={() => updateQuantity(item.productId, item.quantity - 1)}>-</button>
                <span>{item.quantity}</span>
                <button type="button" onClick={() => updateQuantity(item.productId, item.quantity + 1)}>+</button>
              </div>
            </div>
            <div className="cart-item-price">
              <strong>${(item.price * item.quantity).toFixed(2)}</strong>
              <button type="button" className="text-button" onClick={() => removeFromCart(item.productId)}>Remove</button>
            </div>
          </div>
        ))}
      </section>

      <aside className="summary-box">
        <h3>Order summary</h3>
        <div className="summary-row"><span>Subtotal</span><strong>${subtotal.toFixed(2)}</strong></div>
        <div className="summary-row"><span>Shipping</span><strong>${shipping.toFixed(2)}</strong></div>
        <div className="summary-row total-row"><span>Total</span><strong>${total.toFixed(2)}</strong></div>
        <Link to="/checkout" className="primary-button full-width">Proceed to checkout</Link>
        <Link to="/shop" className="secondary-button full-width">Continue shopping</Link>
      </aside>
    </div>
  );
}
