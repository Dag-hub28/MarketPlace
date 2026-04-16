import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { apiRequest, getApiErrorMessage } from '../api'

export default function Login({ onLogin }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
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
    } catch (err) {
      setError(getApiErrorMessage(err) || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="card">
        <h1>Login</h1>
        <form onSubmit={handleSubmit}>
          <label>
            Username
            <input value={username} onChange={(e) => setUsername(e.target.value)} required />
          </label>
          <label>
            Password
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </label>
          {error && <div className="error">{error}</div>}
          <button type="submit" disabled={loading}>{loading ? 'Signing in...' : 'Login'}</button>
        </form>
        <p>
          New here? <Link to="/register">Register</Link>
        </p>
      </div>
    </div>
  );
}
