// pages/owner/ads.ts
// Advertisement management — list, create, edit, delete ads.

import { api } from '../../services/api'
import type { Advertisement } from '../../types'

export async function init(): Promise<void> {
  const app = document.getElementById('app')
  if (!app) return

  app.innerHTML = '<p>Loading advertisements...</p>'

  try {
    const res = await api.get('/owner/ads')
    const ads: Advertisement[] = await res.json()

    app.innerHTML = `
      <section id="owner-ads">
        <div class="page-header">
          <h1>Advertisements</h1>
          <button id="create-ad-btn">+ Create Ad</button>
        </div>
        <div id="ads-list">
          ${ads.length === 0
            ? '<p>No advertisements yet. Create your first ad!</p>'
            : ads.map(ad => `
                <div class="ad-card ${ad.is_active ? '' : 'inactive'}" data-ad-id="${ad.id}">
                  ${ad.promo_image_url ? `<img src="${ad.promo_image_url}" alt="Ad image" class="ad-image" />` : ''}
                  <div class="ad-info">
                    <p class="ad-copy">${ad.copy_text || 'No copy text'}</p>
                    <span class="ad-font-style">${ad.font_style || 'default'}</span>
                  </div>
                  <div class="ad-actions">
                    <button class="edit-ad" data-id="${ad.id}">Edit</button>
                    <button class="delete-ad" data-id="${ad.id}">Delete</button>
                  </div>
                </div>
              `).join('')
          }
        </div>
      </section>
    `
  } catch (err) {
    app.innerHTML = '<p>Failed to load advertisements.</p>'
  }
}
