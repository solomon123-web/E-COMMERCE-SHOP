import { useState } from 'react';
import { Link } from 'react-router-dom';

import { useCart } from '../contexts/CartContext';
import { apiFetch, type Order } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';

export function CheckoutPage() {
  const { items, subtotal, clearCart } = useCart();
  const { token, user } = useAuth();
  const [form, setForm] = useState({
    fullName: '',
    email: user?.email || '',
    phone: '',
    address: '',
    city: '',
    state: '',
    country: 'Nigeria',
    postalCode: '',
  });
  const [error, setError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const shipping = subtotal > 150 ? 0 : 14.99;
  const total = subtotal + shipping;

  const handleChange = (field: string, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setIsProcessing(true);

    try {
      // Step 1: Create the order
      const orderResponse = await apiFetch<{ order: Order }>('/orders', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token ?? ''}`,
        },
        body: JSON.stringify({
          items: items.map((item) => ({ productId: item.productId, quantity: item.quantity })),
          shippingAddress: {
            fullName: form.fullName,
            phone: form.phone,
            address: form.address,
            city: form.city,
            state: form.state,
            country: form.country,
            postalCode: form.postalCode,
          },
          userEmail: form.email,
        }),
      });

      const order = orderResponse.order;

      // Step 2: Initialize Paystack payment
      const paystackResponse = await apiFetch<{
        payment: {
          reference: string;
          authorizationUrl: string;
          amount: number;
        };
      }>('/payments/paystack/initialize', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token ?? ''}`,
        },
        body: JSON.stringify({
          orderId: order.id,
        }),
      });

      // Step 3: Clear cart and redirect to Paystack
      clearCart();
      
      // Redirect to Paystack checkout
      window.location.href = paystackResponse.payment.authorizationUrl;
    } catch (submitError) {
      setIsProcessing(false);
      setError(submitError instanceof Error ? submitError.message : 'Unable to process your order.');
    }
  };

  if (!items.length) {
    return (
      <div className="container page-space empty-state-box">
        <h2>Your cart is empty</h2>
        <Link to="/shop" className="primary-button">Return to shop</Link>
      </div>
    );
  }

  return (
    <div className="container page-space checkout-layout">
      <form className="checkout-form" onSubmit={handleSubmit}>
        <div className="section-heading inline-heading">
          <div>
            <p className="eyebrow">Checkout</p>
            <h2>Customer details</h2>
          </div>
        </div>

        {error ? <p className="form-error">{error}</p> : null}

        <div className="two-column-form">
          <label>
            Full name
            <input 
              value={form.fullName} 
              onChange={(event) => handleChange('fullName', event.target.value)} 
              required 
              disabled={isProcessing}
            />
          </label>
          <label>
            Email
            <input 
              type="email" 
              value={form.email} 
              onChange={(event) => handleChange('email', event.target.value)} 
              required 
              disabled={isProcessing}
            />
          </label>
          <label>
            Phone
            <input 
              value={form.phone} 
              onChange={(event) => handleChange('phone', event.target.value)} 
              required 
              disabled={isProcessing}
            />
          </label>
          <label>
            Address
            <input 
              value={form.address} 
              onChange={(event) => handleChange('address', event.target.value)} 
              required 
              disabled={isProcessing}
            />
          </label>
          <label>
            City
            <input 
              value={form.city} 
              onChange={(event) => handleChange('city', event.target.value)} 
              required 
              disabled={isProcessing}
            />
          </label>
          <label>
            State
            <input 
              value={form.state} 
              onChange={(event) => handleChange('state', event.target.value)} 
              required 
              disabled={isProcessing}
            />
          </label>
          <label>
            Country
            <input 
              value={form.country} 
              onChange={(event) => handleChange('country', event.target.value)} 
              required 
              disabled={isProcessing}
            />
          </label>
          <label>
            Postal code
            <input 
              value={form.postalCode} 
              onChange={(event) => handleChange('postalCode', event.target.value)} 
              required 
              disabled={isProcessing}
            />
          </label>
        </div>

        <div className="payment-box">
          <h3>Payment Method</h3>
          <p style={{ marginBottom: '15px' }}>
            Secure payment via Paystack. Your card information is processed securely.
          </p>
          <button 
            type="submit" 
            className="primary-button full-width" 
            disabled={isProcessing}
            style={{ opacity: isProcessing ? 0.6 : 1 }}
          >
            {isProcessing ? 'Processing...' : 'Pay with Paystack'}
          </button>
        </div>
      </form>

      <aside className="summary-box">
        <h3>Order review</h3>
        {items.map((item) => (
          <div key={item.productId} className="summary-line">
            <span>
              {item.name} × {item.quantity}
            </span>
            <strong>₦{(item.price * item.quantity).toLocaleString('en-NG')}</strong>
          </div>
        ))}
        <div className="summary-row"><span>Subtotal</span><strong>₦{subtotal.toLocaleString('en-NG')}</strong></div>
        <div className="summary-row"><span>Shipping</span><strong>₦{shipping.toLocaleString('en-NG')}</strong></div>
        <div className="summary-row total-row"><span>Total</span><strong>₦{total.toLocaleString('en-NG')}</strong></div>
      </aside>
    </div>
  );
}
