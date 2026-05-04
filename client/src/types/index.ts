// types/index.ts
// Shared TypeScript types for MarketSpace

export type Role = 'customer' | 'shop_owner'
export type OrderStatus = 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled'
export type FontStyle = 'modern' | 'classic' | 'technical' | 'elegant'

export interface Profile {
  id: string
  role: Role
  full_name: string | null
  birthday: string | null
  address: string | null
  created_at: string
}

export interface Shop {
  id: string
  owner_id: string
  name: string
  slug: string
  bio: string | null
  banner_url: string | null
  avatar_url: string | null
  payment_qr_url: string | null
  is_active: boolean
  created_at: string
}

export interface Category {
  id: string
  name: string
  slug: string
}

export interface Product {
  id: string
  shop_id: string
  category_id: string | null
  name: string
  description: string | null
  price: number
  image_url: string | null
  stock: number | null
  is_active: boolean
  created_at: string
}

export interface Advertisement {
  id: string
  shop_id: string
  product_id: string | null
  promo_image_url: string | null
  copy_text: string | null
  font_style: FontStyle
  is_active: boolean
  created_at: string
}

export interface CartItem {
  id: string
  customer_id: string
  product_id: string
  quantity: number
  product?: Product
}

export interface Order {
  id: string
  customer_id: string
  shop_id: string
  status: OrderStatus
  total_amount: number
  created_at: string
}

export interface OrderItem {
  id: string
  order_id: string
  product_id: string
  quantity: number
  price_at_purchase: number
}

export interface ShopView {
  id: string
  shop_id: string
  viewer_id: string | null
  viewed_at: string
}
