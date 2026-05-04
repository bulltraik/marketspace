import { renderOwnerShell } from '../../components/OwnerShell'
import { api } from '../../services/api'
import { supabase } from '../../services/supabase'
import { Product } from '../../types'

export async function init() {
  const app = document.getElementById('app')
  if (!app) return

  app.innerHTML = renderOwnerShell('products', `
    <div class="owner-content-header">
      <h1>Your Products</h1>
      <button id="btn-add-product" class="btn btn-primary btn-sm">+ Add Product</button>
    </div>
    <div style="text-align:center; padding: 4rem; color: var(--text-muted);">
      Loading products...
    </div>
  `)

  try {
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
            <td>$${parseFloat(product.price.toString()).toFixed(2)}</td>
            <td><span class="badge">${product.category_id ? 'Categorized' : 'Uncategorized'}</span></td>
            <td style="text-align: right;"><a class="action-link" href="/owner/products/edit?id=${product.id}">Edit</a></td>
          </tr>
        `
      }).join('')
    }

    const content = `
      <div class="owner-content-header">
        <h1>Your Products</h1>
        <button id="btn-add-product" class="btn btn-primary btn-sm">+ Add Product</button>
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

      <!-- Add Product Modal -->
      <div id="add-product-modal" style="display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 50; align-items: center; justify-content: center; backdrop-filter: blur(4px);">
        <div style="background: white; border-radius: 12px; width: 100%; max-width: 500px; padding: 2rem; max-height: 90vh; overflow-y: auto; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);">
          <h2 style="font-size: 1.25rem; font-weight: 600; margin-bottom: 1.5rem;">Add New Product</h2>
          <form id="add-product-form">
            <div class="form-group">
              <label style="display:block; margin-bottom:0.5rem; font-weight:500;">Product Name *</label>
              <input type="text" id="p-name" class="form-control" required placeholder="e.g. Wireless Headphones">
            </div>
            <div class="form-group">
              <label style="display:block; margin-bottom:0.5rem; font-weight:500;">Price ($) *</label>
              <input type="number" id="p-price" step="0.01" min="0" class="form-control" required placeholder="0.00">
            </div>
            <div class="form-group">
              <label style="display:block; margin-bottom:0.5rem; font-weight:500;">Description</label>
              <textarea id="p-desc" class="form-control" rows="3" placeholder="Describe your product..."></textarea>
            </div>
            <div class="form-group">
              <label style="display:block; margin-bottom:0.5rem; font-weight:500;">Product Image</label>
              <input type="file" id="p-image" class="form-control" accept="image/*">
            </div>
            <div style="display: flex; gap: 1rem; margin-top: 2rem; justify-content: flex-end;">
              <button type="button" id="btn-cancel" class="btn btn-outline btn-sm">Cancel</button>
              <button type="submit" id="btn-save" class="btn btn-primary btn-sm">Save Product</button>
            </div>
          </form>
        </div>
      </div>
    `

    app.innerHTML = renderOwnerShell('products', content)

    // Event Listeners for Modal
    const btnAdd = document.getElementById('btn-add-product')
    const modal = document.getElementById('add-product-modal')
    const btnCancel = document.getElementById('btn-cancel')
    const form = document.getElementById('add-product-form') as HTMLFormElement

    btnAdd?.addEventListener('click', () => {
      if (modal) modal.style.display = 'flex'
    })

    btnCancel?.addEventListener('click', () => {
      if (modal) {
        modal.style.display = 'none'
        form.reset()
      }
    })

    form?.addEventListener('submit', async (e) => {
      e.preventDefault()
      
      const btnSave = document.getElementById('btn-save') as HTMLButtonElement
      btnSave.disabled = true
      btnSave.innerText = 'Saving...'

      try {
        const name = (document.getElementById('p-name') as HTMLInputElement).value
        const price = parseFloat((document.getElementById('p-price') as HTMLInputElement).value)
        const desc = (document.getElementById('p-desc') as HTMLTextAreaElement).value
        const fileInput = document.getElementById('p-image') as HTMLInputElement
        const file = fileInput.files?.[0]

        let imageUrl = null

        // If file is selected, upload to Supabase Storage first
        if (file) {
          const { data: { session } } = await supabase.auth.getSession()
          const userId = session?.user.id || 'unknown'
          const fileExt = file.name.split('.').pop()
          const fileName = `${userId}/${Date.now()}.${fileExt}`

          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('product-images')
            .upload(fileName, file)

          if (uploadError) throw new Error('Image upload failed: ' + uploadError.message)
          imageUrl = uploadData.path
        }

        // Send to PHP Backend
        const saveRes = await api.post('/owner/products', {
          name,
          price,
          description: desc || null,
          image_url: imageUrl
        })

        if (!saveRes.ok) {
          const errData = await saveRes.json()
          throw new Error(errData.message || 'Failed to save product')
        }
        
        // Refresh page to show new data
        init()

      } catch (err: any) {
        alert(err.message)
        btnSave.disabled = false
        btnSave.innerText = 'Save Product'
      }
    })

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
