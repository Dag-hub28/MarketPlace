import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiRequest, logout } from '../api';
import ProductCard from '../components/ProductCard';
import TopBar from '../components/TopBar';

export default function Dashboard({ onLogout }) {
  const [user, setUser] = useState(null);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [applications, setApplications] = useState([]);
  const [selectedApplications, setSelectedApplications] = useState([]);
  const [form, setForm] = useState({ title: '', description: '', price: '', location: '', category_id: '' });
  const [imageFile, setImageFile] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [cartCount, setCartCount] = useState(0);
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleCategorySelect = (id) => {
    setCategoryFilter(categoryFilter === id ? '' : id);
  };

  const token = localStorage.getItem('token');
  const isSeller = user?.role === 'client';
  const isBuyer = user?.role === 'worker';

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }

    const initialize = async () => {
      const currentUser = await fetchCurrentUser();
      if (!currentUser) {
        return;
      }
      await fetchCategories();
      await fetchProducts();
      await fetchCart();
      if (currentUser.role === 'worker') {
        await fetchApplications();
      }
    };

    initialize();
  }, [token, navigate]);

  const fetchCurrentUser = async () => {
    try {
      const data = await apiRequest('/users/me/');
      setUser(data);
      localStorage.setItem('role', data.role);
      return data;
    } catch (err) {
      handleLogout();
      return null;
    }
  };

  const fetchCategories = async () => {
    try {
      const data = await apiRequest('/categories/');
      setCategories(data.results || data);
    } catch (err) {
      setMessage(err.detail || 'Unable to load categories');
    }
  };

  const fetchProducts = async () => {
    try {
      const params = [];
      if (searchTerm) params.push(`search=${encodeURIComponent(searchTerm)}`);
      if (categoryFilter) params.push(`category=${encodeURIComponent(categoryFilter)}`);
      if (sortBy === 'price_asc') params.push('ordering=price');
      if (sortBy === 'price_desc') params.push('ordering=-price');
      if (sortBy === 'newest') params.push('ordering=-created_at');
      const query = params.length ? `?${params.join('&')}` : '';
      const data = await apiRequest(`/products/${query}`);
      setProducts(data.results || data);
    } catch (err) {
      setMessage(err.detail || 'Unable to load products');
    }
  };

  const fetchCart = async () => {
    try {
      const data = await apiRequest('/cart/');
      setCartCount((data.items || []).reduce((sum, item) => sum + item.quantity, 0));
    } catch (_err) {
      setCartCount(0);
    }
  };

  const fetchApplications = async () => {
    try {
      const data = await apiRequest('/applications/');
      setApplications(data.results || data);
    } catch (err) {
      setMessage(err.detail || 'Unable to load requests');
    }
  };

  const handleLogout = () => {
    logout();
    onLogout?.();
    navigate('/login');
  };

  const handleCreateProduct = async (event) => {
    event.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const formData = new FormData();
      formData.append('title', form.title);
      formData.append('description', form.description);
      formData.append('price', form.price);
      formData.append('location', form.location);
      if (form.category_id) {
        formData.append('category_id', form.category_id);
      }
      if (imageFile) {
        formData.append('image', imageFile);
      }

      await apiRequest('/products/', {
        method: 'POST',
        body: formData,
        headers: {} // Don't set Content-Type for FormData
      });
      setForm({ title: '', description: '', price: '', location: '', category_id: '' });
      setImageFile(null);
      await fetchProducts();
      setMessage('Product posted successfully.');
    } catch (err) {
      setMessage(err.detail || 'Unable to post product');
    } finally {
      setLoading(false);
    }
  };

  const handleBuyRequest = async (productId) => {
    setLoading(true);
    setMessage(null);

    try {
      await apiRequest('/applications/', {
        method: 'POST',
        body: JSON.stringify({ product_id: productId }),
      });
      setMessage('Purchase request sent successfully.');
      await fetchApplications();
      await fetchCart();
    } catch (err) {
      setMessage(err.detail || 'Unable to send request');
    } finally {
      setLoading(false);
    }
  };

  const handleViewRequests = async (productId) => {
    setLoading(true);
    setMessage(null);

    try {
      const data = await apiRequest(`/products/${productId}/applications/`);
      setSelectedApplications(data);
    } catch (err) {
      setMessage(err.detail || 'Unable to load requests');
    } finally {
      setLoading(false);
    }
  };

  const handleApplicationDecision = async (appId, action) => {
    setLoading(true);
    setMessage(null);

    try {
      await apiRequest(`/applications/${appId}/${action}/`, { method: 'POST' });
      setMessage(`Request ${action}ed successfully.`);
      await fetchApplications();
      if (isSeller) {
        const productId = selectedApplications.find((app) => app.id === appId)?.product?.id;
        if (productId) handleViewRequests(productId);
      }
    } catch (err) {
      setMessage(err.detail || 'Unable to update request');
    } finally {
      setLoading(false);
    }
  };

  const featuredProducts = products
    .slice()
    .sort((a, b) => (b.avg_rating || 0) - (a.avg_rating || 0) || new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 4);

  return (
    <div className="dashboard-page">
      <TopBar onLogout={handleLogout} />
      <div className="kilimall-promo">
        <div className="promo-message">Campus Marketplace Exclusive: Get special offers for students</div>
        <button className="promo-btn">Explore Deals</button>
      </div>

      <section className="top-categories">
        <div className="category-pill">Kili Featured</div>
        <div className="category-pill">TV, Audio & Video</div>
        <div className="category-pill">Shoes</div>
        <div className="category-pill">Phones & Accessories</div>
        <div className="category-pill">Home & Kitchen</div>
        <div className="category-pill">Health & Beauty</div>
        <div className="category-pill">Appliances</div>
        <div className="category-pill">Bags</div>
      </section>

      <section className="panel">
        <div style={{ padding: 8 }}>
          <h1>Marketplace Dashboard</h1>
          <p>Welcome, {user?.username || 'user'} ({isSeller ? 'Seller' : isBuyer ? 'Buyer' : user?.role})</p>
        </div>
      </section>

      {message && <div className="notice">{message}</div>}

      {isSeller && (
        <section className="panel">
          <h2>Post a Product</h2>
          <form className="product-form" onSubmit={handleCreateProduct}>
            <label>
              Title
              <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
            </label>
            <label>
              Description
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required />
            </label>
            <div className="split-row">
              <label>
                Price
                <input value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required />
              </label>
              <label>
                Location
                <input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} required />
              </label>
            </div>
            <label>
              Product Image
              <input 
                type="file" 
                accept="image/*"
                onChange={(e) => setImageFile(e.target.files[0] || null)} 
              />
            </label>
            <label>
              Category
              <select value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })}>
                <option value="">None</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>{category.name}</option>
                ))}
              </select>
            </label>
            <button type="submit" disabled={loading}>{loading ? 'Posting...' : 'Post Product'}</button>
          </form>
        </section>
      )}

      <section className="hero-banner">
        <div>
          <p>Trusted local services, all in one marketplace</p>
          <h2>Browse the best service offers from buyers and sellers nearby</h2>
        </div>
      </section>

      {featuredProducts.length > 0 && (
        <section className="panel">
          <div className="panel-header">
            <h2>Featured Deals</h2>
          </div>
          <div className="grid">
            {featuredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                actionLabel={isBuyer ? 'Buy' : 'View Requests'}
                action={() => (isBuyer ? handleBuyRequest(product.id) : handleViewRequests(product.id))}
                detailsAction={() => navigate(`/products/${product.id}`)}
                actionDisabled={isBuyer ? product.status !== 'open' : false}
              />
            ))}
          </div>
        </section>
      )}

      <section className="panel">
        <div className="panel-header">
          <h2>{isBuyer ? 'Available Products' : 'Your Products'}</h2>
          <button onClick={fetchProducts} className="ghost">Refresh</button>
        </div>
        <div className="search-row">
          <input
            type="search"
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="newest">Newest</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
          </select>
          <button type="button" onClick={fetchProducts} className="ghost">Search</button>
        </div>
        <div className="category-list">
          {categories.map((category) => (
            <button
              type="button"
              key={category.id}
              className={`category-pill ${categoryFilter === `${category.id}` ? 'active' : ''}`}
              onClick={() => handleCategorySelect(`${category.id}`)}
            >
              {category.name}
            </button>
          ))}
        </div>
        {products.length === 0 ? (
          <p>No products available yet.</p>
        ) : (
          <div className="grid">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                actionLabel={isBuyer ? 'Buy' : 'View Requests'}
                action={() => (isBuyer ? handleBuyRequest(product.id) : handleViewRequests(product.id))}
                detailsAction={() => navigate(`/products/${product.id}`)}
                actionDisabled={isBuyer ? product.status !== 'open' : false}
              />
            ))}
          </div>
        )}
      </section>

      {isBuyer && (
        <section className="panel">
          <h2>Your Requests</h2>
          {applications.length === 0 ? (
            <p>You have not requested any products yet.</p>
          ) : (
            <div className="grid">
              {applications.map((app) => (
                <div key={app.id} className="card small-card">
                  <strong>{app.product.title}</strong>
                  <p>Status: {app.status}</p>
                  <p>Location: {app.product.location}</p>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {selectedApplications.length > 0 && (
        <section className="panel">
          <h2>Requests for selected product</h2>
          <div className="grid">
            {selectedApplications.map((app) => (
              <div key={app.id} className="card small-card">
                <strong>{app.user.username}</strong>
                <p>Status: {app.status}</p>
                <div className="button-row">
                  <button onClick={() => handleApplicationDecision(app.id, 'accept')} disabled={loading || app.status !== 'pending'}>Accept</button>
                  <button onClick={() => handleApplicationDecision(app.id, 'reject')} disabled={loading || app.status !== 'pending'}>Reject</button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
