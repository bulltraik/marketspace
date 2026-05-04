// pages/owner/products.ts
// Product management — list, create, edit, deactivate products.

import { api } from '../../services/api'
import type { Product } from '../../types'

export async function init(): Promise<void> {
  const app = document.getElementById('app')
  if (!app) return

  app.innerHTML = '<p>Loading products...</p>'

  try {
    const res = await api.get('/owner/products')
    const products: Product[] = await res.json()

    app.innerHTML = `
      <section id="owner-products">
        <div class="page-header">
          <h1>Products</h1>
          <button id="add-product-btn">+ Add Product</button>
        </div>
        <div id="product-list">
          ${products.length === 0
            ? '<p>No products yet. Add your first product!</p>'
            : products.map(p => `
                <div class="product-row ${p.is_active ? '' : 'inactive'}" data-product-id="${p.id}">
                  <span class="product-name">${p.name}</span>
                  <span class="product-price">₱${p.price}</span>
                  <span class="product-stock">${p.stock ?? '∞'} in stock</span>
                  <button class="edit-product" data-id="${p.id}">Edit</button>
                </div>
              `).join('')
          }
        </div>
      </section>
    `
  } catch (err) {
    app.innerHTML = '<p>Failed to load products.</p>'
  }
}
