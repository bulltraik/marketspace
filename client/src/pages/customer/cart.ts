// pages/customer/cart.ts
// Shopping cart view — list items, update quantities, remove, checkout.

import { api } from '../../services/api'
import type { CartItem } from '../../types'

export async function init(): Promise<void> {
  const app = document.getElementById('app')
  if (!app) return

  app.innerHTML = '<p>Loading cart...</p>'

  try {
    const res = await api.get('/cart')
    const items: CartItem[] = await res.json()

    render(app, items)
  } catch (err) {
    app.innerHTML = '<p>Failed to load cart.</p>'
  }
}

function render(container: HTMLElement, items: CartItem[]): void {
  if (items.length === 0) {
    container.innerHTML = `
      <section id="cart-page">
        <h1>Your Cart</h1>
        <p>Your cart is empty. <a href="/">Browse shops</a></p>
      </section>
    `
    return
  }

  const total = items.reduce((sum, i) => sum + (i.product?.price ?? 0) * i.quantity, 0)

  container.innerHTML = `
    <section id="cart-page">
      <h1>Your Cart</h1>
      <div id="cart-items">
        ${items.map(i => `
          <div class="cart-item" data-item-id="${i.id}">
            <div class="cart-item-info">
              <h3>${i.product?.name ?? 'Unknown Product'}</h3>
              <p class="cart-item-price">₱${i.product?.price ?? 0}</p>
            </div>
            <div class="cart-item-controls">
              <input type="number" min="1" value="${i.quantity}" class="cart-qty" data-item-id="${i.id}" />
              <button class="cart-remove" data-item-id="${i.id}">Remove</button>
            </div>
          </div>
        `).join('')}
      </div>
      <div id="cart-summary">
        <p class="cart-total">Total: ₱${total.toFixed(2)}</p>
        <button id="checkout-btn">Checkout</button>
      </div>
    </section>
  `

  // Event listeners
  container.querySelectorAll('.cart-remove').forEach(btn => {
    btn.addEventListener('click', async () => {
      const itemId = (btn as HTMLElement).dataset.itemId
      await api.delete(`/cart/${itemId}`)
      init()
    })
  })

  container.querySelector('#checkout-btn')?.addEventListener('click', async () => {
    await api.post('/orders', {})
    window.location.href = '/orders'
  })
}
