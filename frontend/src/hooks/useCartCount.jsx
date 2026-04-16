import { useEffect, useState, useCallback } from 'react';
import { apiRequest } from '../api';

export default function useCartCount() {
  const [cartCount, setCartCount] = useState(0);
  const [error, setError] = useState(null);

  const refreshCartCount = useCallback(async () => {
    try {
      const data = await apiRequest('/cart/');
      setCartCount((data.items || []).reduce((sum, item) => sum + item.quantity, 0));
      setError(null);
    } catch (err) {
      setCartCount(0);
      setError(err.detail || 'Unable to load cart data');
    }
  }, []);

  useEffect(() => {
    refreshCartCount();
  }, [refreshCartCount]);

  return { cartCount, error, refreshCartCount };
}
