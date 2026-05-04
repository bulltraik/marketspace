// pages/auth/register.ts
// Registration page — create account with role selection.

import { api } from '../../services/api'
import { supabase } from '../../services/supabase'

export async function init(): Promise<void> {
  const app = document.getElementById('app')
  if (!app) return

  app.innerHTML = `
    <section class="auth-page">
      <div class="auth-card">
        <div class="auth-icon">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"></path></svg>
        </div>
        <h1>Create Account</h1>
        <p>Join MarketSpace to start shopping or selling.</p>

        <form id="register-form">
          <div class="form-group">
            <input type="text" id="reg-fullname" class="form-control" required placeholder="Full Name" />
          </div>
          <div class="form-group">
            <input type="email" id="reg-email" class="form-control" required placeholder="name@example.com" />
          </div>
          <div class="form-group">
            <input type="password" id="reg-password" class="form-control" required minlength="6" placeholder="Password (min. 6 characters)" />
          </div>
          
          <button type="submit" id="register-btn" class="btn btn-primary btn-block" style="margin-top: 1.5rem;">Sign Up</button>
          <p id="register-error" class="error-message" style="display:none;"></p>
          <p id="register-success" class="success-message" style="display:none;"></p>
        </form>

        <div class="auth-footer">
          Already have an account? <a href="/login">Sign in</a>
        </div>
      </div>
    </section>
  `

  document.getElementById('register-form')?.addEventListener('submit', async (e) => {
    e.preventDefault()
    const email    = (document.getElementById('reg-email') as HTMLInputElement).value
    const password = (document.getElementById('reg-password') as HTMLInputElement).value
    const fullName = (document.getElementById('reg-fullname') as HTMLInputElement).value
    const errorEl  = document.getElementById('register-error')!
    const successEl = document.getElementById('register-success')!

    errorEl.style.display = 'none'
    successEl.style.display = 'none'

    try {
      const { data, error } = await supabase.auth.signUp({ 
        email, 
        password,
        options: {
          data: {
            full_name: fullName,
            role: 'customer'
          }
        }
      })

      if (error) {
        errorEl.textContent = error.message || 'Registration failed'
        errorEl.style.display = 'block'
        return
      }

      // Try to insert the profile. If email confirmation is ON, RLS might block this 
      // because the user isn't fully authenticated yet.
      if (data.user) {
         const { error: profileError } = await supabase.from('profiles').insert({
            id: data.user.id,
            full_name: fullName,
            role: 'customer'
         })
         
         if (profileError) {
           console.error("Profile insert error:", profileError)
           errorEl.textContent = 'User created, but profile failed: ' + profileError.message
           errorEl.style.display = 'block'
           return
         }
      }

      successEl.textContent = 'Account created! Check your email for verification.'
      successEl.style.display = 'block'
    } catch (err: any) {
      errorEl.textContent = err.message || 'Network error'
      errorEl.style.display = 'block'
    }
  })
}
