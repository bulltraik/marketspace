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
      <button id="btn-add-ad" class="btn btn-primary btn-sm">Create New Ad</button>
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
        <button id="btn-add-ad" class="btn btn-primary btn-sm">Create New Ad</button>
      </div>
      ${contentHtml}

      <!-- Create Ad Modal -->
      <div id="add-ad-modal" style="display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 50; align-items: center; justify-content: center; backdrop-filter: blur(4px);">
        <div style="background: white; border-radius: 12px; width: 100%; max-width: 500px; padding: 2rem; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);">
          <h2 style="font-size: 1.25rem; font-weight: 600; margin-bottom: 1.5rem;">Create New Advertisement</h2>
          <form id="add-ad-form">
            <div class="form-group">
              <label style="display:block; margin-bottom:0.5rem; font-weight:500;">Promotional Copy *</label>
              <textarea id="ad-copy" class="form-control" rows="3" required placeholder="Catchy headline or description..."></textarea>
            </div>
            <div class="form-group">
              <label style="display:block; margin-bottom:0.5rem; font-weight:500;">Font Style</label>
              <select id="ad-font" class="form-control">
                <option value="modern">Modern (Inter)</option>
                <option value="classic">Classic (Serif)</option>
                <option value="technical">Technical (Monospace)</option>
                <option value="elegant">Elegant (Cursive)</option>
              </select>
            </div>
            <div class="form-group">
              <label style="display:block; margin-bottom:0.5rem; font-weight:500;">Promo Image (Optional)</label>
              <input type="file" id="ad-image" class="form-control" accept="image/*">
            </div>
            <div style="display: flex; gap: 1rem; margin-top: 2rem; justify-content: flex-end;">
              <button type="button" id="btn-cancel-ad" class="btn btn-outline btn-sm">Cancel</button>
              <button type="submit" id="btn-save-ad" class="btn btn-primary btn-sm">Create Ad</button>
            </div>
          </form>
        </div>
      </div>
    `

    app.innerHTML = renderOwnerShell('ads', finalHtml)

    // Event Listeners for Modal
    const btnAdd = document.getElementById('btn-add-ad')
    const modal = document.getElementById('add-ad-modal')
    const btnCancel = document.getElementById('btn-cancel-ad')
    const form = document.getElementById('add-ad-form') as HTMLFormElement

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
      
      const btnSave = document.getElementById('btn-save-ad') as HTMLButtonElement
      btnSave.disabled = true
      btnSave.innerText = 'Creating...'

      try {
        const copy_text = (document.getElementById('ad-copy') as HTMLTextAreaElement).value
        const font_style = (document.getElementById('ad-font') as HTMLSelectElement).value
        const fileInput = document.getElementById('ad-image') as HTMLInputElement
        const file = fileInput.files?.[0]

        let imageUrl = null

        if (file) {
          const { data: { session } } = await supabase.auth.getSession()
          const userId = session?.user.id || 'unknown'
          const fileExt = file.name.split('.').pop()
          const fileName = \`\${userId}/\${Date.now()}.\${fileExt}\`

          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('ad-images')
            .upload(fileName, file)

          if (uploadError) throw new Error('Image upload failed: ' + uploadError.message)
          imageUrl = uploadData.path
        }

        const saveRes = await api.post('/owner/ads', {
          copy_text,
          font_style,
          promo_image_url: imageUrl
        })

        if (!saveRes.ok) {
          const errData = await saveRes.json()
          throw new Error(errData.message || 'Failed to create ad')
        }
        
        init()

      } catch (err: any) {
        alert(err.message)
        btnSave.disabled = false
        btnSave.innerText = 'Create Ad'
      }
    })

  } catch (error: any) {
    app.innerHTML = renderOwnerShell('ads', `
      <div class="owner-content-header">
        <h1>Advertisement</h1>
      </div>
      <div class="error-message" style="padding: 2rem;">Error loading ads: ${error.message}</div>
    `)
  }
}
