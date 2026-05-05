// pages/auth/login.ts
// Login page — email/password authentication.

import { api } from '../../services/api'
import { supabase } from '../../services/supabase'

export async function init(): Promise<void> {
  const app = document.getElementById('app')
  if (!app) return

  // If user is already logged in, skip the login page
  const { data: { session } } = await supabase.auth.getSession()
  if (session) {
    window.location.href = '/dashboard'
    return
  }

  app.innerHTML = `
    <section class="auth-page">
      <div class="auth-card">
        <div class="auth-icon">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>
        </div>
        <h1>Welcome Back</h1>
        <p>Sign in to manage your account and shop.</p>
        
        <button id="github-login-btn" class="btn btn-dark btn-block">
          <svg fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.379.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.161 22 16.416 22 12c0-5.523-4.477-10-10-10z"></path></svg>
          Continue with GitHub
        </button>

        <div class="divider">OR USE EMAIL</div>

        <form id="login-form">
          <div class="form-group">
            <input type="email" id="login-email" class="form-control" required placeholder="name@example.com" />
          </div>
          <div class="form-group">
            <input type="password" id="login-password" class="form-control" required placeholder="Password" />
          </div>
          <button type="submit" id="login-btn" class="btn btn-dark btn-block">Sign In</button>
          <p id="login-error" class="error-message" style="display:none;"></p>
        </form>

        <div class="auth-footer">
          Don't have an account? <a href="/register">Sign up</a>
        </div>
      </div>
    </section>
  `

  // Email/password login
  document.getElementById('login-form')?.addEventListener('submit', async (e) => {
    e.preventDefault()
    const email    = (document.getElementById('login-email') as HTMLInputElement).value
    const password = (document.getElementById('login-password') as HTMLInputElement).value
    const errorEl  = document.getElementById('login-error')!
    const loginBtn = document.getElementById('login-btn') as HTMLButtonElement

    errorEl.style.display = 'none'
    loginBtn.disabled = true
    loginBtn.textContent = 'Signing in...'

    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })

      if (error) {
        errorEl.textContent = error.message || 'Login failed'
        errorEl.style.display = 'block'
        loginBtn.disabled = false
        loginBtn.textContent = 'Sign In'
        return
      }

      if (!data.session) {
        errorEl.textContent = 'Login succeeded but no session was returned. Check your Supabase API key.'
        errorEl.style.display = 'block'
        loginBtn.disabled = false
        loginBtn.textContent = 'Sign In'
        return
      }

      // Session is now stored in localStorage by the Supabase client.
      // Redirect to dashboard.
      window.location.href = '/dashboard'
    } catch (err: any) {
      errorEl.textContent = err.message || 'Network error'
      errorEl.style.display = 'block'
      loginBtn.disabled = false
      loginBtn.textContent = 'Sign In'
    }
  })

  // GitHub OAuth
  document.getElementById('github-login-btn')?.addEventListener('click', async () => {
    await supabase.auth.signInWithOAuth({ provider: 'github' })
  })
}
