import { renderOwnerShell } from '../../components/OwnerShell'
import { api } from '../../services/api'
import { supabase } from '../../services/supabase'

export async function init() {
  const app = document.getElementById('app')
  if (!app) return

  app.innerHTML = renderOwnerShell('settings', `
    <div class="owner-content-header">
      <h1>Shop Settings</h1>
    </div>
    <div style="text-align:center; padding: 4rem; color: var(--text-muted);">
      Loading settings...
    </div>
  `)

  try {
    const res = await api.get('/owner/shop')
    
    if (!res.ok) {
      if (res.status === 401 || res.status === 403) {
        window.location.href = '/login'
        return
      }
      throw new Error('Failed to fetch shop settings')
    }
    
    const json = await res.json()
    const shop = json.data || {}

    const content = `
      <div class="owner-content-header">
        <h1>Shop Settings</h1>
        <button id="btn-save-settings" class="btn btn-primary btn-sm">Save Changes</button>
      </div>
      
      <div style="max-width: 600px; margin-bottom: 3rem;">
        <h2 style="font-size: 1.1rem; font-weight: 600; margin-bottom: 1rem;">Shop Profile</h2>
        <form id="settings-form">
          <div class="form-group">
            <label style="display:block; margin-bottom:0.5rem; font-weight:500;">Shop Name</label>
            <input type="text" id="shop-name" class="form-control" value="${shop.name || ''}" required>
          </div>
          <div class="form-group">
            <label style="display:block; margin-bottom:0.5rem; font-weight:500;">Shop Bio</label>
            <textarea id="shop-bio" class="form-control" rows="4" placeholder="Tell customers about your shop...">${shop.bio || ''}</textarea>
          </div>
        </form>
      </div>

      <div style="max-width: 600px; padding-top: 2rem; border-top: 1px solid var(--border-color);">
        <h2 style="font-size: 1.1rem; font-weight: 600; margin-bottom: 1rem;">Payment Information</h2>
        <p style="color: var(--text-muted); font-size: 0.9rem; margin-bottom: 1rem;">
          Upload your payment QR code (e.g., CashApp, Venmo, PayPal) so customers can pay you securely. This image is kept private until checkout.
        </p>
        
        <div style="display: flex; gap: 1rem; align-items: center;">
          <input type="file" id="qr-upload" accept="image/*" style="display:none;">
          <button id="btn-upload-qr" class="btn btn-outline btn-sm">
            ${shop.payment_qr_url ? 'Replace QR Code' : 'Upload QR Code'}
          </button>
          <span id="qr-status" style="font-size: 0.875rem; color: #10b981; display: none;">✓ Uploaded successfully</span>
        </div>
      </div>
    `

    app.innerHTML = renderOwnerShell('settings', content)

    // Save Basic Settings
    const btnSave = document.getElementById('btn-save-settings') as HTMLButtonElement
    btnSave?.addEventListener('click', async () => {
      btnSave.disabled = true
      btnSave.innerText = 'Saving...'

      const name = (document.getElementById('shop-name') as HTMLInputElement).value
      const bio = (document.getElementById('shop-bio') as HTMLTextAreaElement).value

      try {
        const updateRes = await api.put('/owner/shop', { name, bio })
        if (!updateRes.ok) throw new Error('Failed to update shop')
        
        btnSave.innerText = 'Saved!'
        setTimeout(() => {
          btnSave.disabled = false
          btnSave.innerText = 'Save Changes'
        }, 2000)

      } catch (err: any) {
        alert(err.message)
        btnSave.disabled = false
        btnSave.innerText = 'Save Changes'
      }
    })

    // QR Code Upload
    const btnUpload = document.getElementById('btn-upload-qr') as HTMLButtonElement
    const fileInput = document.getElementById('qr-upload') as HTMLInputElement
    const qrStatus = document.getElementById('qr-status') as HTMLElement

    btnUpload?.addEventListener('click', () => {
      fileInput.click()
    })

    fileInput?.addEventListener('change', async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return

      btnUpload.disabled = true
      btnUpload.innerText = 'Uploading...'
      qrStatus.style.display = 'none'

      try {
        const { data: { session } } = await supabase.auth.getSession()
        const userId = session?.user.id || 'unknown'
        const fileExt = file.name.split('.').pop()
        const fileName = \`\${userId}/\${Date.now()}.\${fileExt}\`

        // Upload to private bucket
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('payment-qr-codes')
          .upload(fileName, file)

        if (uploadError) throw new Error('Failed to upload image')

        // Save URL to DB
        const qrRes = await api.put('/owner/shop/qr', { payment_qr_url: uploadData.path })
        if (!qrRes.ok) throw new Error('Failed to save QR code setting')

        btnUpload.innerText = 'Replace QR Code'
        btnUpload.disabled = false
        qrStatus.style.display = 'inline-block'

      } catch (err: any) {
        alert(err.message)
        btnUpload.disabled = false
        btnUpload.innerText = 'Upload QR Code'
      }
    })

  } catch (error: any) {
    app.innerHTML = renderOwnerShell('settings', `
      <div class="owner-content-header">
        <h1>Shop Settings</h1>
      </div>
      <div class="error-message" style="padding: 2rem;">Error loading settings: ${error.message}</div>
    `)
  }
}
