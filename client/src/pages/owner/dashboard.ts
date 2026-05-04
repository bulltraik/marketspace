import { renderOwnerShell } from '../../components/OwnerShell'

export async function init() {
  const app = document.getElementById('app')
  if (!app) return

  const content = `
    <div class="owner-content-header">
      <h1>Analytics</h1>
    </div>
    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; margin-bottom: 2rem;">
      <div style="padding: 1.5rem; background: #f9fafb; border-radius: 8px; border: 1px solid #e5e7eb;">
        <span style="color: #6b7280; font-size: 0.875rem; font-weight: 500;">Total Sales</span>
        <div style="font-size: 1.5rem; font-weight: 700; margin-top: 0.5rem; color: #111827;">$0.00</div>
      </div>
      <div style="padding: 1.5rem; background: #f9fafb; border-radius: 8px; border: 1px solid #e5e7eb;">
        <span style="color: #6b7280; font-size: 0.875rem; font-weight: 500;">Total Orders</span>
        <div style="font-size: 1.5rem; font-weight: 700; margin-top: 0.5rem; color: #111827;">0</div>
      </div>
      <div style="padding: 1.5rem; background: #f9fafb; border-radius: 8px; border: 1px solid #e5e7eb;">
        <span style="color: #6b7280; font-size: 0.875rem; font-weight: 500;">Shop Views</span>
        <div style="font-size: 1.5rem; font-weight: 700; margin-top: 0.5rem; color: #111827;">0</div>
      </div>
    </div>
  `

  app.innerHTML = renderOwnerShell('analytics', content)
}
