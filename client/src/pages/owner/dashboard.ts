// pages/owner/dashboard.ts
// Shop owner dashboard — shop stats, recent orders, quick links.

import { api } from '../../services/api'
import type { Shop, Order } from '../../types'

export async function init(): Promise<void> {
  const app = document.getElementById('app')
  if (!app) return

  app.innerHTML = '<p>Loading owner dashboard...</p>'

  try {
    const [shopRes, ordersRes] = await Promise.all([
      api.get('/owner/shop'),
      api.get('/owner/orders'),
    ])

    const shop: Shop = await shopRes.json()
    const orders: Order[] = await ordersRes.json()

    const pendingCount = orders.filter(o => o.status === 'pending').length

    app.innerHTML = `
      <section id="owner-dashboard">
        <h1>${shop.name}</h1>
        <div id="owner-stats">
          <div class="stat-card">
            <span class="stat-value">${orders.length}</span>
            <span class="stat-label">Total Orders</span>
          </div>
          <div class="stat-card">
            <span class="stat-value">${pendingCount}</span>
            <span class="stat-label">Pending</span>
          </div>
        </div>
        <nav id="owner-quick-links">
          <a href="/owner/products">Manage Products</a>
          <a href="/owner/ads">Advertisements</a>
          <a href="/owner/settings">Shop Settings</a>
        </nav>
      </section>
    `
  } catch (err) {
    app.innerHTML = '<p>Failed to load dashboard.</p>'
  }
}
