// pages/owner/settings.ts
// Shop settings — update shop info, media, payment QR.

import { api } from '../../services/api'
import type { Shop } from '../../types'

export async function init(): Promise<void> {
  const app = document.getElementById('app')
  if (!app) return

  app.innerHTML = '<p>Loading shop settings...</p>'

  try {
    const res = await api.get('/owner/shop')
    const shop: Shop = await res.json()

    app.innerHTML = `
      <section id="owner-settings">
        <h1>Shop Settings</h1>
        <form id="shop-settings-form">
          <div class="form-group">
            <label for="shop-name">Shop Name</label>
            <input type="text" id="shop-name" value="${shop.name}" />
          </div>
          <div class="form-group">
            <label for="shop-slug">Slug</label>
            <input type="text" id="shop-slug" value="${shop.slug}" />
          </div>
          <div class="form-group">
            <label for="shop-bio">Bio</label>
            <textarea id="shop-bio">${shop.bio || ''}</textarea>
          </div>
          <button type="submit" id="save-settings-btn">Save Changes</button>
        </form>

        <hr />

        <h2>Media</h2>
        <div id="media-section">
          <div class="media-upload" id="banner-upload">
            <label>Banner Image</label>
            <input type="file" id="banner-file" accept="image/*" />
          </div>
          <div class="media-upload" id="avatar-upload">
            <label>Avatar / Logo</label>
            <input type="file" id="avatar-file" accept="image/*" />
          </div>
        </div>

        <hr />

        <h2>Payment QR Code</h2>
        <div id="qr-section">
          <input type="file" id="qr-file" accept="image/*" />
          <button id="upload-qr-btn">Upload QR</button>
        </div>
      </section>
    `

    // Save settings handler
    document.getElementById('shop-settings-form')?.addEventListener('submit', async (e) => {
      e.preventDefault()
      const name = (document.getElementById('shop-name') as HTMLInputElement).value
      const slug = (document.getElementById('shop-slug') as HTMLInputElement).value
      const bio  = (document.getElementById('shop-bio') as HTMLTextAreaElement).value

      await api.put('/owner/shop', { name, slug, bio })
      alert('Settings saved!')
    })
  } catch (err) {
    app.innerHTML = '<p>Failed to load settings.</p>'
  }
}
