import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { apiFetch, type Order } from '../lib/api';

export function AccountPage() {
  const { user, token } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchOrders() {
      if (!user || !token) return;

      try {
        const response = await apiFetch<{ orders: Order[] }>('/orders', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setOrders(response.orders);
      } catch (error) {
        console.error('Failed to fetch orders:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchOrders();
  }, [user, token]);

  if (!user) {
    return <div className="container page-space">Please log in to view your account.</div>;
  }

  return (
    <div className="container page-space account-layout">
      <div className="account-card">
        <p className="eyebrow">Account</p>
        <h1>{user.name}</h1>
        <p>{user.email}</p>
        <p>Role: {user.role}</p>
      </div>
      
      <div className="account-card">
        <h2>Orders</h2>
        {loading ? (
          <p>Loading your orders...</p>
        ) : orders.length === 0 ? (
          <p>No orders yet. Start shopping to see your order history here.</p>
        ) : (
          <div style={{ display: 'grid', gap: '12px' }}>
            {orders.map((order) => (
              <div 
                key={order.id} 
                style={{
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  padding: '12px',
                  background: '#f9fafb'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <div>
                    <p style={{ margin: '0', fontWeight: 'bold', fontSize: '14px' }}>
                      Order #{order.orderNumber}
                    </p>
                    <p style={{ margin: '4px 0 0 0', color: '#6b7280', fontSize: '12px' }}>
                      {new Date(order.createdAt).toLocaleDateString('en-NG')}
                    </p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ margin: '0', fontWeight: 'bold', fontSize: '14px' }}>
                      ₦{order.total.toLocaleString('en-NG')}
                    </p>
                    <p style={{ margin: '4px 0 0 0', fontSize: '12px' }}>
                      {order.paymentStatus === 'paid' ? (
                        <span style={{ color: '#22c55e' }}>✓ Paid</span>
                      ) : (
                        <span style={{ color: '#ef4444' }}>• {order.paymentStatus}</span>
                      )}
                    </p>
                  </div>
                </div>
                <p style={{ margin: '0', color: '#6b7280', fontSize: '12px' }}>
                  Items: {order.items.length} • Status: {order.orderStatus}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
