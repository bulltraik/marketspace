// services/api.ts
// Fetch wrapper for the PHP API — automatically attaches the Supabase JWT.

import { supabase } from './supabase'

async function apiFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const { data: { session } } = await supabase.auth.getSession()
  const token = session?.access_token

  return fetch(`/api${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  })
}

export const api = {
  get:    (path: string)                => apiFetch(path),
  post:   (path: string, body: unknown) => apiFetch(path, { method: 'POST',   body: JSON.stringify(body) }),
  put:    (path: string, body: unknown) => apiFetch(path, { method: 'PUT',    body: JSON.stringify(body) }),
  delete: (path: string)                => apiFetch(path, { method: 'DELETE' }),
}
