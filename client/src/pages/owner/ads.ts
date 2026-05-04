import { renderOwnerShell } from '../../components/OwnerShell'
import { api } from '../../services/api'
import { Advertisement } from '../../types'
import { supabase } from '../../services/supabase'

export async function init() {
  const app = document.getElementById('app')
  if (!app) return

  app.innerHTML = renderOwnerShell('ads', `
    <div class="owner-content-header">
      <h1>Advertisement</h1>
      <button class="btn btn-primary btn-sm">Create New Ad</button>
    </div>
    <div style="text-align:center; padding: 4rem; color: var(--text-muted);">
      Loading advertisements...
    </div>
  `)

  try {
    const res = await api.get('/owner/ads')
    
    if (!res.ok) {
      if (res.status === 401 || res.status === 403) {
        window.location.href = '/login'
        return
      }
      throw new Error('Failed to fetch ads')
    }
    
    const json = await res.json()
    const ads: Advertisement[] = json.data || []

    let contentHtml = ''
    
    if (ads.length === 0) {
      contentHtml = `
        <div class="empty-state-card" style="padding: 4rem 2rem;">
          <svg style="margin: 0 auto 1rem; color: #9ca3af; width: 48px; height: 48px;" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
          <p>No active advertisements.</p>
          <span>Create an ad to promote your shop on the homepage.</span>
        </div>
      `
    } else {
      contentHtml = `
        <table class="data-table">
          <thead>
            <tr>
              <th>Image</th>
              <th>Copy Text</th>
              <th>Style</th>
              <th>Status</th>
              <th style="text-align: right;">Actions</th>
            </tr>
          </thead>
          <tbody>
            ${ads.map(ad => {
              let imageUrl = '<div style="width: 80px; height: 40px; background: #f3f4f6; border-radius: 4px;"></div>'
              if (ad.promo_image_url) {
                const { data } = supabase.storage.from('ad-images').getPublicUrl(ad.promo_image_url)
                imageUrl = `<img src="${data.publicUrl}" alt="Ad" style="width: 80px; height: 40px; border-radius: 4px; object-fit: cover;" />`
              }
              
              return `
                <tr>
                  <td>${imageUrl}</td>
                  <td style="max-width: 200px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                    ${ad.copy_text || 'No text'}
                  </td>
                  <td style="text-transform: capitalize;">${ad.font_style}</td>
                  <td>
                    <span class="badge" style="background: ${ad.is_active ? '#d1fae5' : '#fef3c7'}; color: ${ad.is_active ? '#065f46' : '#92400e'};">
                      ${ad.is_active ? 'Active' : 'Paused'}
                    </span>
                  </td>
                  <td style="text-align: right;"><a class="action-link" href="/owner/ads/edit?id=${ad.id}">Edit</a></td>
                </tr>
              `
            }).join('')}
          </tbody>
        </table>
      `
    }

    const finalHtml = `
      <div class="owner-content-header">
        <h1>Advertisement</h1>
        <button class="btn btn-primary btn-sm">Create New Ad</button>
      </div>
      ${contentHtml}
    `

    app.innerHTML = renderOwnerShell('ads', finalHtml)

  } catch (error: any) {
    app.innerHTML = renderOwnerShell('ads', `
      <div class="owner-content-header">
        <h1>Advertisement</h1>
      </div>
      <div class="error-message" style="padding: 2rem;">Error loading ads: ${error.message}</div>
    `)
  }
}
