import { getUserId } from './userId'

export const API_BASE = import.meta.env.DEV ? 'http://localhost:3001' : ''

export function apiFetch(path, options = {}) {
  return fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'x-user-id': getUserId(),
      ...options.headers,
    },
  })
}

export function adminFetch(path, options = {}) {
  const token = localStorage.getItem('ppo_admin_token') || ''
  return fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers,
    },
  })
}
