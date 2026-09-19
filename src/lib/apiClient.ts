// Thin fetch wrapper for the Clinic backend (server/), ported from the
// reference implementation's frontend/src/api/client.js pattern: Bearer
// token from localStorage, attached on every request, cleared + redirected
// to /login on a 401.
const TOKEN_KEY = 'arogya-kumbh-token'

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string | null) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token)
  } else {
    localStorage.removeItem(TOKEN_KEY)
  }
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY)
}

export class ApiError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> | undefined),
  }

  const token = getToken()
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const response = await fetch(`/api${path}`, { ...options, headers })

  if (response.status === 401) {
    clearToken()
    if (window.location.pathname !== '/login') {
      window.location.href = '/login'
    }
  }

  let data: unknown = null
  try {
    data = await response.json()
  } catch {
    data = null
  }

  if (!response.ok) {
    const message = (data as { error?: string } | null)?.error ?? `Request failed with status ${response.status}`
    throw new ApiError(message, response.status)
  }

  return data as T
}

export interface SessionUser {
  email: string
  role: 'doctor' | 'nurse' | 'receptionist' | 'hr'
  tenantId: string
}

export interface DevUser {
  email: string
  name: string
  role: SessionUser['role']
}

export const api = {
  sendOtp(email: string) {
    return request<{ message: string }>('/auth/send-otp', {
      method: 'POST',
      body: JSON.stringify({ email }),
    })
  },

  verifyOtp(email: string, otp: string) {
    return request<{ token: string; user: SessionUser }>('/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ email, otp }),
    })
  },

  me() {
    return request<SessionUser>('/auth/me')
  },

  // Dev-only convenience endpoints. The backend only registers these routes
  // outside production, so calling them against a real deployment 404s.
  getDevUsers() {
    return request<DevUser[]>('/dev/users')
  },

  devSignIn(email: string) {
    return request<{ token: string; user: SessionUser }>('/dev/session', {
      method: 'POST',
      body: JSON.stringify({ email }),
    })
  },
}
