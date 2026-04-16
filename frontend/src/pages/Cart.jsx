import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiRequest } from '../api';
import TopBar from '../components/TopBar';

export default function Cart() {
  const [cart, setCart] = useState({ items: [] });
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const loadCart = async () => {
    try {
      const data = await apiRequest('/cart/');
      setCart(data);
      setMessage(null);
    } catch (err) {
      setMessage(err.detail || 'Unable to load cart');
    }
  };

  useEffect(() => {
    loadCart();
  }, []);

  const updateItem = async (itemId, quantity) => {
    if (quantity <= 0) {
      return removeItem(itemId);
    }
    setLoading(true);
    try {
      await apiRequest(`/cart/${itemId}/`, {
        method: 'PUT',
        body: JSON.stringify({ quantity }),
      });
      await loadCart();
    } catch (err) {
      setMessage(err.detail || 'Unable to update cart item');
    } finally {
      setLoading(false);
    }
  };

  const removeItem = async (itemId) => {
    setLoading(true);
    try {
      await apiRequest(`/cart/${itemId}/`, {
        method: 'DELETE',
      });
      await loadCart();
    } catch (err) {
      setMessage(err.detail || 'Unable to remove item');
    } finally {
      setLoading(false);
    }
  };

  const checkout = async () => {
    setLoading(true);
    setMessage(null);
    try {
      await apiRequest('/orders/', {
        method: 'POST',
        body: JSON.stringify({}),
      });
      setMessage('Order placed successfully.');
      await loadCart();
      navigate('/orders');
    } catch (err) {
      setMessage(err.detail || 'Unable to checkout');
    } finally {
      setLoading(false);
    }
  };

  const cartTotal = cart.items.reduce((total, item) => total + item.price * item.quantity, 0);

  return (
    <div className="dashboard-page">
      <TopBar />
      <section className="panel">
        <div style={{ padding: 8 }}>
          <h1>Cart</h1>
          <p>Manage your cart items and place your order</p>
        </div>
        <button className="ghost" onClick={() => navigate('/dashboard')}>Back to Marketplace</button>
      </section>

      {message && <div className="notice">{message}</div>}

      <section className="panel">
        {cart.items.length === 0 ? (
          <p>Your shopping cart is empty.</p>
        ) : (
          <div className="grid">
            {cart.items.map((item) => (
              <div key={item.id} className="card small-card">
                <h3>{item.product.title}</h3>
                <p>Unit price: ${item.price}</p>
                <p>Quantity: {item.quantity}</p>
                <div className="button-row">
                  <button onClick={() => updateItem(item.id, item.quantity - 1)} disabled={loading}>-</button>
                  <button onClick={() => updateItem(item.id, item.quantity + 1)} disabled={loading}>+</button>
                  <button onClick={() => removeItem(item.id)} disabled={loading}>Remove</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="panel">
        <h2>Summary</h2>
        <p>Items: {cart.items.length}</p>
        <p>Total: ${cartTotal.toFixed(2)}</p>
        <button onClick={checkout} disabled={loading || cart.items.length === 0}>Checkout</button>
      </section>
    </div>
  );
}
