// pages/customer/orders.ts
// Customer order history.

import { api } from '../../services/api'
import type { Order } from '../../types'

export async function init(): Promise<void> {
  const app = document.getElementById('app')
  if (!app) return

  app.innerHTML = '<p>Loading orders...</p>'

  try {
    const res = await api.get('/customer/orders')
    const orders: Order[] = await res.json()

    app.innerHTML = `
      <section id="orders-page">
        <h1>Your Orders</h1>
        ${orders.length === 0
          ? '<p>No orders yet.</p>'
          : `<div id="orders-list">
              ${orders.map(o => `
                <div class="order-card" data-order-id="${o.id}">
                  <div class="order-header">
                    <span class="order-id">#${o.id.slice(0, 8)}</span>
                    <span class="order-status status-${o.status}">${o.status}</span>
                  </div>
                  <div class="order-body">
                    <span class="order-total">₱${o.total_amount}</span>
                    <span class="order-date">${new Date(o.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              `).join('')}
            </div>`
        }
      </section>
    `
  } catch (err) {
    app.innerHTML = '<p>Failed to load orders.</p>'
  }
}
