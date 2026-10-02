import { useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';

import { apiFetch, type Order } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';

export function OrderSuccessPage() {
  const { orderNumber } = useParams();
  const [searchParams] = useSearchParams();
  const { token } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function verifyPayment() {
      try {
        // Get the payment reference from Paystack callback
        const reference = searchParams.get('reference');
        
        if (!reference) {
          setError('No payment reference found. Payment verification skipped.');
          setLoading(false);
          return;
        }

        if (!token) {
          setError('Not authenticated. Cannot verify payment.');
          setLoading(false);
          return;
        }

        // Verify the payment with the backend
        const response = await apiFetch<{
          order: Order;
          paymentStatus: string;
        }>(`/payments/paystack/verify/${reference}`, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.paymentStatus === 'paid') {
          setOrder(response.order);
        } else {
          setError('Payment verification failed. Your order may not have been confirmed.');
        }
      } catch (err) {
        console.error('Payment verification error:', err);
        setError(err instanceof Error ? err.message : 'Unable to verify payment.');
      } finally {
        setLoading(false);
      }
    }

    verifyPayment();
  }, [orderNumber, searchParams, token]);

  if (loading) {
    return (
      <div className="container page-space empty-state-box">
        <p>Verifying your payment...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container page-space empty-state-box">
        <p style={{ color: '#dc2626' }}>⚠️ {error}</p>
        <p>If your payment was successful, your order will be confirmed shortly.</p>
        <Link to="/account" className="primary-button">View your orders</Link>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container page-space empty-state-box">
        <p>Order not found.</p>
        <Link to="/shop" className="primary-button">Return to shop</Link>
      </div>
    );
  }

  return (
    <div className="container page-space empty-state-box success-box">
      <p className="eyebrow">✓ Order placed</p>
      <h1>Thank you for your purchase!</h1>
      
      <div style={{ 
        background: '#f0fdf4', 
        border: '1px solid #86efac', 
        borderRadius: '8px', 
        padding: '16px', 
        margin: '20px 0',
        textAlign: 'center'
      }}>
        <p style={{ margin: '0 0 5px 0', color: '#166534', fontSize: '14px' }}>✓ Payment confirmed</p>
        <p style={{ margin: '0', fontWeight: 'bold', color: '#15803d', fontSize: '16px' }}>
          Order #{order.orderNumber}
        </p>
        <p style={{ margin: '8px 0 0 0', color: '#6b7280', fontSize: '13px' }}>
          Total: ₦{order.total.toLocaleString('en-NG')}
        </p>
      </div>

      <div style={{ 
        background: '#f3f4f6', 
        borderRadius: '8px', 
        padding: '16px', 
        margin: '20px 0',
        textAlign: 'left'
      }}>
        <h3 style={{ marginTop: 0, marginBottom: '12px' }}>Order Details</h3>
        <p style={{ margin: '8px 0' }}>
          <strong>Payment Status:</strong> <span style={{ color: '#22c55e', fontWeight: 'bold' }}>Paid</span>
        </p>
        <p style={{ margin: '8px 0' }}>
          <strong>Order Status:</strong> <span style={{ textTransform: 'capitalize' }}>{order.orderStatus}</span>
        </p>
        <p style={{ margin: '8px 0' }}>
          <strong>Email:</strong> {order.email}
        </p>
        <p style={{ margin: '8px 0' }}>
          <strong>Date:</strong> {new Date(order.createdAt).toLocaleString('en-NG')}
        </p>
      </div>

      <p style={{ color: '#6b7280', fontSize: '14px', marginTop: '20px' }}>
        A confirmation email has been sent to your email address with order details.
      </p>
      
      <div className="card-actions">
        <Link to="/shop" className="primary-button">Continue shopping</Link>
        <Link to="/account" className="secondary-button">View all orders</Link>
      </div>
    </div>
  );
}
