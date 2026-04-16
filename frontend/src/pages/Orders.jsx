import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiRequest } from '../api';
import TopBar from '../components/TopBar';

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const loadOrders = async (status = 'all') => {
    try {
      const params = status === 'all' ? '' : `?status=${encodeURIComponent(status)}`;
      const data = await apiRequest(`/orders/${params}`);
      setOrders(data.results || data);
      setMessage(null);
    } catch (err) {
      setMessage(err.detail || 'Unable to load orders');
    }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    setLoading(true);
    try {
      await apiRequest(`/orders/${orderId}/status/`, {
        method: 'POST',
        body: JSON.stringify({ status: newStatus }),
      });
      setMessage(`Order ${orderId} status updated to ${newStatus}.`);
      await loadOrders();
    } catch (err) {
      setMessage(err.detail || 'Unable to update order status');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders(statusFilter);
  }, [statusFilter]);

  return (
    <div className="dashboard-page">
      <TopBar />
      <section className="panel">
        <div style={{ padding: 8 }}>
          <h1>Order History</h1>
          <p>Review your past purchases</p>
        </div>
        <button className="ghost" onClick={() => navigate('/dashboard')}>Back to Marketplace</button>
      </section>

      {message && <div className="notice">{message}</div>}

      <section className="panel">
        <div className="button-row">
          <button className={statusFilter === 'all' ? 'active' : ''} onClick={() => setStatusFilter('all')}>All</button>
          <button className={statusFilter === 'pending' ? 'active' : ''} onClick={() => setStatusFilter('pending')}>Pending</button>
          <button className={statusFilter === 'completed' ? 'active' : ''} onClick={() => setStatusFilter('completed')}>Completed</button>
          <button className={statusFilter === 'cancelled' ? 'active' : ''} onClick={() => setStatusFilter('cancelled')}>Cancelled</button>
        </div>
        {orders.length === 0 ? (
          <p>No orders placed yet.</p>
        ) : (
          <div className="grid">
            {orders.map((order) => (
              <div key={order.id} className="card small-card">
                <h3>Order #{order.id}</h3>
                <p>Total: ${order.total}</p>
                <p>Status: {order.status}</p>
                <p>Date: {new Date(order.created_at).toLocaleString()}</p>
                <div className="button-row">
                  {order.items.map((item) => (
                    <div key={item.id} className="item-row">
                      <strong>{item.product?.title || 'N/A'}</strong> x{item.quantity} @ ${item.price}
                    </div>
                  ))}
                </div>
                {order.status === 'pending' && (
                  <div className="button-row">
                    <button onClick={() => updateOrderStatus(order.id, 'completed')} disabled={loading}>Mark as Completed</button>
                    <button onClick={() => updateOrderStatus(order.id, 'cancelled')} disabled={loading}>Cancel Order</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
