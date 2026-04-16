import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { apiRequest, getApiErrorMessage } from '../api'

export default function Register({ onLogin }) {
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('client')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const loginAfterRegister = async () => {
    const result = await apiRequest('/auth/login/', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    localStorage.setItem('token', result.access);
    localStorage.setItem('refresh', result.refresh);
    const user = await apiRequest('/users/me/');
    localStorage.setItem('role', user.role);
    onLogin?.();
    navigate('/dashboard');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await apiRequest('/auth/register/', {
        method: 'POST',
        body: JSON.stringify({ username, email, password, role }),
      });
      await loginAfterRegister();
    } catch (err) {
      setError(getApiErrorMessage(err) || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="card">
        <h1>Create Account</h1>
        <form onSubmit={handleSubmit}>
          <label>
            Username
            <input value={username} onChange={(e) => setUsername(e.target.value)} required />
          </label>
          <label>
            Email
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </label>
          <label>
            Password
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </label>
          <label>
            Role
            <select value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="client">Seller</option>
              <option value="worker">Buyer</option>
            </select>
          </label>
          {error && <div className="error">{error}</div>}
          <button type="submit" disabled={loading}>{loading ? 'Registering...' : 'Register'}</button>
        </form>
        <p>
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </div>
    </div>
  );
}
