import { renderOwnerShell } from '../../components/OwnerShell'
import { api } from '../../services/api'
import { Order } from '../../types'

export async function init() {
  const app = document.getElementById('app')
  if (!app) return

  app.innerHTML = renderOwnerShell('analytics', `
    <div class="owner-content-header">
      <h1>Analytics</h1>
    </div>
    <div style="text-align:center; padding: 4rem; color: var(--text-muted);">
      Loading analytics...
    </div>
  `)

  try {
    // We can fetch orders to calculate total sales and total orders
    const [shopRes, ordersRes] = await Promise.all([
      api.get('/owner/shop'),
      api.get('/owner/orders')
    ])

    if (shopRes.status === 401 || shopRes.status === 403) {
      window.location.href = '/login'
      return
    }

    const shopJson = await shopRes.json()
    const ordersJson = await ordersRes.json()

    const shop = shopJson.data || {}
    const orders: Order[] = ordersJson.data || []

    let totalSales = 0
    let totalOrders = orders.length
    
    // Sum only completed/paid orders for total revenue
    orders.forEach(order => {
      if (['paid', 'shipped', 'delivered'].includes(order.status)) {
        totalSales += parseFloat(order.total_amount.toString())
      }
    })

    const content = `
      <div class="owner-content-header">
        <h1>Analytics</h1>
      </div>
      <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; margin-bottom: 2rem;">
        <div style="padding: 1.5rem; background: #f9fafb; border-radius: 8px; border: 1px solid #e5e7eb;">
          <span style="color: #6b7280; font-size: 0.875rem; font-weight: 500;">Total Sales</span>
          <div style="font-size: 1.5rem; font-weight: 700; margin-top: 0.5rem; color: #111827;">
            $${totalSales.toFixed(2)}
          </div>
        </div>
        <div style="padding: 1.5rem; background: #f9fafb; border-radius: 8px; border: 1px solid #e5e7eb;">
          <span style="color: #6b7280; font-size: 0.875rem; font-weight: 500;">Total Orders</span>
          <div style="font-size: 1.5rem; font-weight: 700; margin-top: 0.5rem; color: #111827;">
            ${totalOrders}
          </div>
        </div>
        <div style="padding: 1.5rem; background: #f9fafb; border-radius: 8px; border: 1px solid #e5e7eb;">
          <span style="color: #6b7280; font-size: 0.875rem; font-weight: 500;">Shop Status</span>
          <div style="font-size: 1.25rem; font-weight: 700; margin-top: 0.5rem; color: ${shop.is_active ? '#10b981' : '#ef4444'};">
            ${shop.is_active ? 'Active' : 'Inactive'}
          </div>
        </div>
      </div>
      
      <h2 style="font-size: 1.25rem; font-weight: 600; margin-bottom: 1rem; margin-top: 2rem;">Recent Orders</h2>
      <table class="data-table">
        <thead>
          <tr>
            <th>Order ID</th>
            <th>Status</th>
            <th>Amount</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody>
          ${orders.length === 0 ? `
            <tr><td colspan="4" style="text-align:center; padding:2rem; color:var(--text-muted);">No orders yet.</td></tr>
          ` : orders.slice(0, 5).map(o => `
            <tr>
              <td><span style="font-family: monospace; color: var(--text-muted);">${o.id.split('-')[0]}</span></td>
              <td><span class="badge" style="text-transform: capitalize;">${o.status}</span></td>
              <td style="font-weight: 500;">$${o.total_amount}</td>
              <td style="color: var(--text-muted);">${new Date(o.created_at).toLocaleDateString()}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `

    app.innerHTML = renderOwnerShell('analytics', content)

  } catch (error: any) {
    app.innerHTML = renderOwnerShell('analytics', `
      <div class="owner-content-header">
        <h1>Analytics</h1>
      </div>
      <div class="error-message" style="padding: 2rem;">Error loading data: ${error.message}</div>
    `)
  }
}
