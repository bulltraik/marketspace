import { renderOwnerShell } from '../../components/OwnerShell'
import { api } from '../../services/api'
import { supabase } from '../../services/supabase'
import { Product } from '../../types'

export async function init() {
  const app = document.getElementById('app')
  if (!app) return

  // 1. Render loading state inside the shell
  app.innerHTML = renderOwnerShell('products', `
    <div class="owner-content-header">
      <h1>Your Products</h1>
      <button class="btn btn-primary btn-sm">+ Add Product</button>
    </div>
    <div style="text-align:center; padding: 4rem; color: var(--text-muted);">
      Loading products...
    </div>
  `)

  try {
    // 2. Fetch data from Render backend
    const res = await api.get('/owner/products')
    
    if (!res.ok) {
      if (res.status === 401 || res.status === 403) {
        window.location.href = '/login'
        return
      }
      throw new Error('Failed to fetch products')
    }
    
    const json = await res.json()
    const products: Product[] = json.data || []

    let tbodyHtml = ''
    
    // 3. Render Empty State or Data Table
    if (products.length === 0) {
      tbodyHtml = `
        <tr>
          <td colspan="4" style="text-align: center; padding: 4rem 2rem; color: var(--text-muted);">
            <svg style="margin: 0 auto 1rem; color: #9ca3af; width: 48px; height: 48px;" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path></svg>
            <p>No products found.</p>
            <span style="font-size: 0.875rem;">Click "+ Add Product" to create your first item.</span>
          </td>
        </tr>
      `
    } else {
      tbodyHtml = products.map(product => {
        let imageUrl = ''
        if (product.image_url) {
           const { data } = supabase.storage.from('product-images').getPublicUrl(product.image_url)
           imageUrl = `<img src="${data.publicUrl}" alt="${product.name}" style="width: 40px; height: 40px; border-radius: 8px; object-fit: cover; flex-shrink: 0;" />`
        } else {
           imageUrl = `
            <div style="width: 40px; height: 40px; background: #f3f4f6; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: #9ca3af; flex-shrink: 0;">
              <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
            </div>
           `
        }

        return `
          <tr>
            <td style="display: flex; align-items: center; gap: 1rem;">
              ${imageUrl}
              <span style="font-weight: 500; color: var(--text-main);">${product.name}</span>
            </td>
            <td>$${product.price}</td>
            <td><span class="badge">${product.category_id ? 'Categorized' : 'Uncategorized'}</span></td>
            <td style="text-align: right;"><a class="action-link" href="/owner/products/edit?id=${product.id}">Edit</a></td>
          </tr>
        `
      }).join('')
    }

    const content = `
      <div class="owner-content-header">
        <h1>Your Products</h1>
        <button class="btn btn-primary btn-sm">+ Add Product</button>
      </div>
      
      <table class="data-table">
        <thead>
          <tr>
            <th>Product</th>
            <th>Price</th>
            <th>Category</th>
            <th style="text-align: right;">Actions</th>
          </tr>
        </thead>
        <tbody id="products-tbody">
          ${tbodyHtml}
        </tbody>
      </table>
    `

    // Render final content
    app.innerHTML = renderOwnerShell('products', content)

  } catch (error: any) {
    app.innerHTML = renderOwnerShell('products', `
      <div class="owner-content-header">
        <h1>Your Products</h1>
      </div>
      <div class="error-message" style="padding: 2rem;">
        Error loading products: ${error.message}
      </div>
    `)
  }
}
