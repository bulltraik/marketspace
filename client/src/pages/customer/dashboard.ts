// pages/customer/dashboard.ts
// Customer dashboard — overview of recent orders and account info.

import { api } from '../../services/api'
import { supabase } from '../../services/supabase'
import type { Profile, Order } from '../../types'

export async function init(): Promise<void> {
  const app = document.getElementById('app')
  if (!app) return

  // 1. First check if user has a valid local Supabase session
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    // No local session → redirect to login
    window.location.href = '/login'
    return
  }

  app.innerHTML = '<p>Loading dashboard...</p>'

  try {
    const [profileRes, ordersRes] = await Promise.all([
      api.get('/profile'),
      api.get('/customer/orders'),
    ])

    // If the backend rejects the token, it might be expired.
    // Try refreshing the session first before giving up.
    if (profileRes.status === 401 || profileRes.status === 403) {
      const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession()
      
      if (refreshError || !refreshData.session) {
        // Session is truly expired, sign out cleanly and redirect
        await supabase.auth.signOut()
        window.location.href = '/login'
        return
      }

      // Retry the request with the refreshed token
      const retryRes = await api.get('/profile')
      if (retryRes.status === 401 || retryRes.status === 403) {
        await supabase.auth.signOut()
        window.location.href = '/login'
        return
      }

      // Use the retried response
      const retryProfileJson = await retryRes.json()
      const retryOrdersRes = await api.get('/customer/orders')
      const retryOrdersJson = await retryOrdersRes.json()
      
      renderDashboard(app, retryProfileJson.data || retryProfileJson, retryOrdersJson.data || [])
      return
    }

    const profileJson = await profileRes.json()
    const ordersJson = await ordersRes.json()

    const profile: Profile = profileJson.data || profileJson
    const orders: Order[] = ordersJson.data || []

    renderDashboard(app, profile, orders)

  } catch (err) {
    app.innerHTML = `<p>Failed to load dashboard. Please check your connection and try again.</p>
    <button class="btn btn-primary" onclick="window.location.reload()">Retry</button>`
  }
}

function renderDashboard(app: HTMLElement, profile: Profile, orders: Order[]) {
  app.innerHTML = `
    <section id="customer-dashboard">
      <h1>Welcome, ${profile.full_name || 'Customer'}</h1>
      <div id="recent-orders">
        <h2>Recent Orders</h2>
        ${orders.length === 0
      ? '<p>No orders yet. Start browsing!</p>'
      : orders.slice(0, 5).map(o => `
              <div class="order-card" data-order-id="${o.id}">
                <span class="order-status">${o.status}</span>
                <span class="order-total">₱${o.total_amount}</span>
                <span class="order-date">${new Date(o.created_at).toLocaleDateString()}</span>
              </div>
            `).join('')
    }
      </div>
      
      ${profile.role !== 'shop_owner' ? `
      <div id="setup-shop-section" style="margin-top: 3rem; padding: 2rem; background: var(--card-bg); border-radius: 12px; border: 1px solid var(--border-color);">
        <h2 style="margin-bottom: 0.5rem; font-size: 1.5rem;">Open Your Own Shop</h2>
        <p style="color: var(--text-muted); margin-bottom: 1.5rem;">Ready to start selling your products? Create your shop right now.</p>
        <form id="setup-shop-form" style="display: flex; gap: 1rem; align-items: flex-start;">
          <div style="flex: 1;">
            <input type="text" id="shop-name" class="form-control" required placeholder="Enter your new shop name" />
          </div>
          <button type="submit" class="btn btn-primary" style="white-space: nowrap;">Create Shop</button>
        </form>
        <p id="shop-error" class="error-message" style="display:none; margin-top: 1rem;"></p>
      </div>
      ` : `
      <div style="margin-top: 3rem; padding: 2rem; background: var(--card-bg); border-radius: 12px; border: 1px solid var(--border-color); text-align: center;">
        <h2 style="margin-bottom: 0.5rem; font-size: 1.5rem;">Your Shop is Live</h2>
        <p style="color: var(--text-muted); margin-bottom: 1.5rem;">Manage your products, view ads, and track owner orders.</p>
        <a href="/owner/dashboard" class="btn btn-primary">Go to Shop Dashboard</a>
      </div>
      `}
    </section>
  `

  // Setup shop event listener
  document.getElementById('setup-shop-form')?.addEventListener('submit', async (e) => {
    e.preventDefault()
    const shopName = (document.getElementById('shop-name') as HTMLInputElement).value
    const errorEl = document.getElementById('shop-error')!

    errorEl.style.display = 'none'
    const btn = e.target as HTMLFormElement
    const submitBtn = btn.querySelector('button[type="submit"]') as HTMLButtonElement
    submitBtn.disabled = true
    submitBtn.textContent = 'Creating...'

    try {
      const res = await api.post('/customer/shop', { name: shopName })
      if (!res.ok) {
        const data = await res.json()
        errorEl.textContent = data.error || 'Failed to create shop'
        errorEl.style.display = 'block'
        submitBtn.disabled = false
        submitBtn.textContent = 'Create Shop'
        return
      }

      window.location.href = '/owner/dashboard'
    } catch (err) {
      errorEl.textContent = 'Network error'
      errorEl.style.display = 'block'
      submitBtn.disabled = false
      submitBtn.textContent = 'Create Shop'
    }
  })
}
