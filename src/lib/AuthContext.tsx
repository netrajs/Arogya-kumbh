import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { api, getToken, setToken, clearToken, type SessionUser } from './apiClient'

interface AuthApi {
  user: SessionUser | null
  loading: boolean
  isAuthenticated: boolean
  sendOtp: (email: string) => Promise<{ message: string }>
  verifyOtp: (email: string, otp: string) => Promise<SessionUser>
  devSignIn: (email: string) => Promise<SessionUser>
  logout: () => void
}

const AuthContext = createContext<AuthApi | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function loadUser() {
      if (!getToken()) {
        setLoading(false)
        return
      }
      try {
        const me = await api.me()
        if (!cancelled) setUser(me)
      } catch {
        clearToken()
        if (!cancelled) setUser(null)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadUser()
    return () => {
      cancelled = true
    }
  }, [])

  const sendOtp = (email: string) => api.sendOtp(email)

  const verifyOtp = async (email: string, otp: string) => {
    const result = await api.verifyOtp(email, otp)
    setToken(result.token)
    setUser(result.user)
    return result.user
  }

  const devSignIn = async (email: string) => {
    const result = await api.devSignIn(email)
    setToken(result.token)
    setUser(result.user)
    return result.user
  }

  const logout = () => {
    clearToken()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, isAuthenticated: !!user, sendOtp, verifyOtp, devSignIn, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider')
  return ctx
}
