// main.ts
// MarketSpace — Client entry point with client-side routing.

import { supabase } from './services/supabase'

const routes: Record<string, () => Promise<void>> = {
  '/':                () => import('./pages/customer/browse').then(m => m.init()),
  '/dashboard':       () => import('./pages/customer/dashboard').then(m => m.init()),
  '/cart':            () => import('./pages/customer/cart').then(m => m.init()),
  '/orders':          () => import('./pages/customer/orders').then(m => m.init()),
  '/owner/dashboard': () => import('./pages/owner/dashboard').then(m => m.init()),
  '/owner/products':  () => import('./pages/owner/products').then(m => m.init()),
  '/owner/ads':       () => import('./pages/owner/ads').then(m => m.init()),
  '/owner/settings':  () => import('./pages/owner/settings').then(m => m.init()),
  '/login':           () => import('./pages/auth/login').then(m => m.init()),
  '/register':        () => import('./pages/auth/register').then(m => m.init()),
  '/verify':          () => import('./pages/auth/verify').then(m => m.init()),
}

async function route(): Promise<void> {
  const path = window.location.pathname
  const handler = routes[path]

  // Update nav button dynamically based on auth status
  const navBtn = document.getElementById('nav-auth-btn') as HTMLAnchorElement | null
  if (navBtn) {
    const { data: { session } } = await supabase.auth.getSession()
    if (session) {
      // Very naive check for role based on route structure preference, ideally we fetch profile
      // But for layout purposes, linking to /dashboard will redirect appropriately if we check role later
      navBtn.href = '/dashboard'
      navBtn.innerHTML = 'Dashboard'
    } else {
      navBtn.href = '/login'
      navBtn.innerHTML = 'Sign In <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"></path></svg>'
    }
  }

  if (handler) {
    await handler()
  } else {
    const app = document.getElementById('app')
    if (app) {
      app.innerHTML = `
        <section id="not-found" style="text-align:center; padding:4rem;">
          <h1>404</h1>
          <p>Page not found</p>
          <a href="/">Back to Home</a>
        </section>
      `
    }
  }
}

// Handle client-side navigation
document.addEventListener('click', (e) => {
  const target = e.target as HTMLElement
  const anchor = target.closest('a')
  if (!anchor) return

  const href = anchor.getAttribute('href')
  if (!href || href.startsWith('http') || href.startsWith('#')) return

  e.preventDefault()
  window.history.pushState({}, '', href)
  route()
})

window.addEventListener('popstate', () => route())

// Initial route
route()
