import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { apiRequest, logout } from '../api';
import TopBar from '../components/TopBar';

export default function ProductDetail() {
  const [product, setProduct] = useState(null);
  const [messages, setMessages] = useState([]);
  const [applications, setApplications] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [content, setContent] = useState('');
  const [recipientId, setRecipientId] = useState('');
  const [reviewRating, setReviewRating] = useState('5');
  const [reviewComment, setReviewComment] = useState('');
  const [messageError, setMessageError] = useState(null);
  const [pageMessage, setPageMessage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const { id } = useParams();

  useEffect(() => {
    const loadPage = async () => {
      const currentUser = await fetchCurrentUser();
      if (!currentUser) {
        return;
      }
      await fetchProduct(currentUser);
      await fetchMessages();
      await fetchReviews();
      if (currentUser.role === 'client') {
        await fetchApplications();
      }
    };

    loadPage();
  }, [id]);

  const fetchCurrentUser = async () => {
    try {
      const data = await apiRequest('/users/me/');
      setUser(data);
      return data;
    } catch (err) {
      logout();
      navigate('/login');
      return null;
    }
  };

  const fetchProduct = async (currentUser) => {
    try {
      const data = await apiRequest(`/products/${id}/`);
      setProduct(data);
      if (currentUser?.role === 'worker') {
        setRecipientId(data.created_by?.id || '');
      }
    } catch (err) {
      setPageMessage(err.detail || 'Unable to load product');
    }
  };

  const fetchMessages = async () => {
    try {
      const data = await apiRequest(`/messages/?product=${id}`);
      setMessages(data.results || data);
    } catch (err) {
      setPageMessage(err.detail || 'Unable to load chat messages');
    }
  };

  const fetchApplications = async () => {
    try {
      const data = await apiRequest(`/products/${id}/applications/`);
      setApplications(data);
      if (!recipientId && data.length > 0) {
        setRecipientId(data[0].user.id);
      }
    } catch (err) {
      setPageMessage(err.detail || 'Unable to load requests');
    }
  };

  const fetchReviews = async () => {
    try {
      const data = await apiRequest(`/reviews/?product=${id}`);
      setReviews(data.results || data);
    } catch (err) {
      setPageMessage(err.detail || 'Unable to load reviews');
    }
  };

  const handleBuyRequest = async () => {
    setLoading(true);
    setPageMessage(null);

    try {
      await apiRequest('/applications/', {
        method: 'POST',
        body: JSON.stringify({ product_id: id }),
      });
      setPageMessage('Purchase request sent successfully.');
      await fetchProduct(user);
      await fetchMessages();
      if (user?.role === 'client') {
        await fetchApplications();
      }
    } catch (err) {
      setPageMessage(err.detail || 'Unable to send request');
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (event) => {
    event.preventDefault();
    setLoading(true);
    setMessageError(null);

    try {
      await apiRequest('/messages/', {
        method: 'POST',
        body: JSON.stringify({
          product_id: id,
          recipient_id: recipientId,
          content,
        }),
      });
      setContent('');
      setPageMessage('Message sent successfully.');
      await fetchMessages();
    } catch (err) {
      setMessageError(err.detail || 'Unable to send message');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReview = async (event) => {
    event.preventDefault();
    setLoading(true);
    setMessageError(null);

    try {
      await apiRequest('/reviews/', {
        method: 'POST',
        body: JSON.stringify({
          product_id: id,
          rating: Number(reviewRating),
          comment: reviewComment,
        }),
      });
      setReviewComment('');
      setReviewRating('5');
      setPageMessage('Review submitted successfully.');
      await fetchReviews();
    } catch (err) {
      setMessageError(err.detail || 'Unable to submit review');
    } finally {
      setLoading(false);
    }
  };

  if (!product) {
    return (
      <div className="dashboard-page">
        <button className="ghost" onClick={() => navigate('/dashboard')}>Back to dashboard</button>
        <p>Loading product...</p>
      </div>
    );
  }

  const isSeller = user?.role === 'client';
  const isBuyer = user?.role === 'worker';
  const seller = product.created_by;

  return (
    <div className="dashboard-page">
      <TopBar />
      <section className="panel">
        <div style={{ padding: 8 }}>
          <h1>Product Details</h1>
          <p>{product.title}</p>
        </div>
        <button className="ghost" onClick={() => navigate('/dashboard')}>Back</button>
      </section>

      {pageMessage && <div className="notice">{pageMessage}</div>}

      <section className="panel">
        <div className="product-image">
          {product.image_url ? (
            <img src={product.image_url.startsWith('http') ? product.image_url : `http://127.0.0.1:8000${product.image_url}`} alt={product.title} style={{ width: '100%', borderRadius: '20px' }} />
          ) : (
            <div className="image-placeholder">Product image placeholder</div>
          )}
        </div>
        <h2>{product.title}</h2>
        <p>{product.description}</p>
        <p><strong>Price:</strong> ${product.price}</p>
        <p><strong>Location:</strong> {product.location}</p>
        {product.category && <p><strong>Category:</strong> {product.category.name}</p>}
        <p><strong>Seller:</strong> {seller?.username}</p>
        <p><strong>Status:</strong> {product.status.replace('_', ' ')}</p>
        {product.avg_rating && (
          <p><strong>Rating:</strong> {product.avg_rating} / 5 ({product.review_count} reviews)</p>
        )}
        {isBuyer && product.status === 'open' && (
          <>
            <button onClick={handleBuyRequest} disabled={loading}>Buy Now</button>
            <button
              className="ghost"
              onClick={async () => {
                setLoading(true);
                try {
                  await apiRequest('/cart/', {
                    method: 'POST',
                    body: JSON.stringify({ product_id: id, quantity: 1 }),
                  });
                  setPageMessage('Product added to cart.');
                } catch (err) {
                  setPageMessage(err.detail || 'Unable to add to cart');
                } finally {
                  setLoading(false);
                }
              }}
              disabled={loading}
            >
              Add to Cart
            </button>
          </>
        )}
      </section>

      <section className="panel">
        <h2>Chat</h2>
        <p>Use the message box below to communicate with the product owner or buyer.</p>
        {isSeller && applications.length === 0 && (
          <p>No buyers have requested this product yet. Messages will still be visible once a request is submitted.</p>
        )}
        <div className="card small-card">
          {messages.length === 0 ? (
            <p>No messages yet.</p>
          ) : (
            messages.map((messageItem) => (
              <div key={messageItem.id} className="message-entry">
                <strong>{messageItem.sender.username}</strong> to <strong>{messageItem.recipient.username}</strong>
                <p>{messageItem.content}</p>
                <small>{new Date(messageItem.created_at).toLocaleString()}</small>
              </div>
            ))
          )}
        </div>
        <form onSubmit={handleSendMessage}>
          {isSeller && (
            <label>
              Recipient
              <select value={recipientId} onChange={(e) => setRecipientId(e.target.value)} required>
                <option value="">Select a buyer</option>
                {applications.map((application) => (
                  <option key={application.id} value={application.user.id}>{application.user.username}</option>
                ))}
              </select>
            </label>
          )}
          <label>
            Message
            <textarea value={content} onChange={(e) => setContent(e.target.value)} required />
          </label>
          {messageError && <div className="error">{messageError}</div>}
          <button type="submit" disabled={loading || !content || (!recipientId && isSeller)}>{loading ? 'Sending...' : 'Send Message'}</button>
        </form>
      </section>

      <section className="panel">
        <h2>Reviews</h2>
        {reviews.length === 0 ? (
          <p>No reviews yet. Be the first to leave feedback.</p>
        ) : (
          <div className="grid">
            {reviews.map((review) => (
              <div key={review.id} className="card small-card">
                <strong>{review.user.username}</strong>
                <p>Rating: {review.rating} / 5</p>
                {review.comment && <p>{review.comment}</p>}
                <small>{new Date(review.created_at).toLocaleDateString()}</small>
              </div>
            ))}
          </div>
        )}
        <form onSubmit={handleSubmitReview}>
          <label>
            Rating
            <select value={reviewRating} onChange={(e) => setReviewRating(e.target.value)}>
              {[5, 4, 3, 2, 1].map((value) => (
                <option key={value} value={value}>{value} stars</option>
              ))}
            </select>
          </label>
          <label>
            Comment
            <textarea value={reviewComment} onChange={(e) => setReviewComment(e.target.value)} />
          </label>
          {messageError && <div className="error">{messageError}</div>}
          <button type="submit" disabled={loading}>{loading ? 'Submitting...' : 'Submit Review'}</button>
        </form>
      </section>
    </div>
  );
}
