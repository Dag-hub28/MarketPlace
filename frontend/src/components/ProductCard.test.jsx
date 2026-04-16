import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import ProductCard from './ProductCard'

describe('ProductCard', () => {
  const mockProduct = {
    id: 1,
    title: 'Test Product',
    description: 'A test product',
    price: 100,
    image_url: null,
    created_at: new Date().toISOString(),
    category: { name: 'Test Category' },
    avg_rating: 4.5,
    review_count: 10,
    location: 'Test Location',
    status: 'open',
    created_by: { username: 'testuser' }
  }

  it('renders product information', () => {
    render(<ProductCard product={mockProduct} />)
    
    expect(screen.getByText('Test Product')).toBeTruthy()
    expect(screen.getByText('A test product')).toBeTruthy()
    expect(screen.getByText('KSh100')).toBeTruthy()
  })
})