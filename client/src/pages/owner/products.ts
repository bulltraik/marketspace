import { renderOwnerShell } from '../../components/OwnerShell'
import { api } from '../../services/api'

export async function init() {
  const app = document.getElementById('app')
  if (!app) return

  // Mockup static content representing the products layout
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
        <tr>
          <td style="display: flex; align-items: center; gap: 1rem;">
            <div style="width: 40px; height: 40px; background: #f3f4f6; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: #9ca3af;">
              <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
            </div>
            <span style="font-weight: 500;">Example Product 1</span>
          </td>
          <td>$29.99</td>
          <td><span class="badge">Accessories</span></td>
          <td style="text-align: right;"><a class="action-link">Edit</a></td>
        </tr>
        <tr>
          <td style="display: flex; align-items: center; gap: 1rem;">
            <div style="width: 40px; height: 40px; background: #f3f4f6; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: #9ca3af;">
              <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
            </div>
            <span style="font-weight: 500;">Example Product 2</span>
          </td>
          <td>$49.99</td>
          <td><span class="badge">Apparel</span></td>
          <td style="text-align: right;"><a class="action-link">Edit</a></td>
        </tr>
      </tbody>
    </table>
  `

  app.innerHTML = renderOwnerShell('products', content)
}
