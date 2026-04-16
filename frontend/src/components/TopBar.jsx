import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { logout } from '../api'
import useCartCount from '../hooks/useCartCount'

export default function TopBar({ onLogout }) {
  const { cartCount, error, refreshCartCount } = useCartCount()
  const location = useLocation()
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    refreshCartCount()
  }, [location, refreshCartCount])

  const handleLogout = async () => {
    await logout()
    if (onLogout) onLogout()
    navigate('/login')
  }

  const handleSearch = () => {
    const q = searchQuery.trim()
    if (q) {
      navigate(`/dashboard?search=${encodeURIComponent(q)}`)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  return (
    <div className="topbar kilimall-topbar">
      <div className="topbar-left">
        <Link to="/dashboard" className="topbar-logo">
          C
        </Link>
        <span className="topbar-brand">Campus Marketplace</span>
      </div>

      <div className="topbar-search">
        <input
          type="search"
          placeholder="I'm looking for..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button className="search-btn" onClick={handleSearch}>
          Search
        </button>
      </div>

      <div className="topbar-right">
        <Link
          to="/dashboard"
          className={location.pathname === '/dashboard' ? 'active' : ''}
        >
          Home
        </Link>
        <Link
          to="/cart"
          className={location.pathname === '/cart' ? 'active' : ''}
        >
          Cart ({cartCount})
        </Link>
        <Link
          to="/orders"
          className={location.pathname === '/orders' ? 'active' : ''}
        >
          Orders
        </Link>
        <button className="ghost" onClick={handleLogout}>
          Logout
        </button>
      </div>
      {error && <div className="notice small">{error}</div>}
    </div>
  )
}
