 import { useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import ProductDetail from './pages/ProductDetail'
import Cart from './pages/Cart'
import Orders from './pages/Orders'

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'))

  const handleLogin = () => {
    setToken(localStorage.getItem('token'))
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('role')
    setToken(null)
  }

  return (
    <div className="app-shell">
      <Toaster position="top-right" />
      <Routes>
        <Route
          path="/"
          element={token ? <Navigate to="/dashboard" /> : <Navigate to="/login" />}
        />
        <Route path="/login" element={<Login onLogin={handleLogin} />} />
        <Route path="/register" element={<Register onLogin={handleLogin} />} />
        <Route
          path="/dashboard"
          element={token ? <Dashboard onLogout={handleLogout} /> : <Navigate to="/login" />}
        />
        <Route
          path="/products/:id"
          element={token ? <ProductDetail /> : <Navigate to="/login" />}
        />
        <Route
          path="/cart"
          element={token ? <Cart /> : <Navigate to="/login" />}
        />
        <Route
          path="/orders"
          element={token ? <Orders /> : <Navigate to="/login" />}
        />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </div>
  )
}

export default App
