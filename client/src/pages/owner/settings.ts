import { renderOwnerShell } from '../../components/OwnerShell'

export async function init() {
  const app = document.getElementById('app')
  if (!app) return

  const content = `
    <div class="owner-content-header">
      <h1>Shop Settings</h1>
      <button class="btn btn-primary btn-sm">Save Changes</button>
    </div>
    <div style="max-width: 600px;">
      <div class="form-group">
        <label style="display:block; margin-bottom:0.5rem; font-weight:500;">Shop Name</label>
        <input type="text" class="form-control" placeholder="Enter your shop name">
      </div>
      <div class="form-group">
        <label style="display:block; margin-bottom:0.5rem; font-weight:500;">Shop Bio</label>
        <textarea class="form-control" rows="4" placeholder="Tell customers about your shop..."></textarea>
      </div>
      <div class="form-group">
        <label style="display:block; margin-bottom:0.5rem; font-weight:500;">Payment QR Code</label>
        <div style="border: 2px dashed #e5e7eb; padding: 2rem; border-radius: 8px; text-align: center; color: #9ca3af;">
          Click to upload your payment QR code
        </div>
      </div>
    </div>
  `

  app.innerHTML = renderOwnerShell('settings', content)
}
