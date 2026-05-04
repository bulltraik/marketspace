import { renderOwnerShell } from '../../components/OwnerShell'

export async function init() {
  const app = document.getElementById('app')
  if (!app) return

  const content = `
    <div class="owner-content-header">
      <h1>Advertisement</h1>
      <button class="btn btn-primary btn-sm">Create New Ad</button>
    </div>
    <div class="empty-state-card" style="padding: 4rem 2rem;">
      <svg style="margin: 0 auto 1rem; color: #9ca3af; width: 48px; height: 48px;" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
      <p>No active advertisements.</p>
      <span>Create an ad to promote your shop on the homepage.</span>
    </div>
  `

  app.innerHTML = renderOwnerShell('ads', content)
}
