// pages/auth/verify.ts
// Email verification landing page.

export async function init(): Promise<void> {
  const app = document.getElementById('app')
  if (!app) return

  app.innerHTML = `
    <section id="verify-page">
      <h1>Verify Your Email</h1>
      <p>We've sent a verification link to your email address.</p>
      <p>Please check your inbox (and spam folder) and click the link to activate your account.</p>
      <a href="/login" class="btn-primary">Back to Sign In</a>
    </section>
  `
}
