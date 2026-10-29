import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { StudyProfile, User } from '../types'
import { hashPassword, readUsers, SESSION_KEY, USERS_KEY, verifyPassword, writeUsers } from '../lib/auth'
import { demoCredentials, demoPasswordHash, demoUser, emptyProfile } from '../data/seed'

interface AuthContextValue {
  user: User | null
  users: User[]
  loading: boolean
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>
  demoLogin: () => Promise<{ ok: boolean; error?: string }>
  register: (name: string, email: string, password: string) => Promise<{ ok: boolean; error?: string }>
  logout: () => void
  updateProfile: (profile: Partial<StudyProfile>) => void
  changePassword: (currentPassword: string, newPassword: string) => Promise<{ ok: boolean; error?: string }>
  setRole: (role: User['role']) => void
  isAdmin: boolean
}

const AuthContext = createContext<AuthContextValue | null>(null)

const ADMIN_EMAIL = 'admin@upscmentor.app'

async function ensureSeedUsers(): Promise<User[]> {
  const existing = readUsers()
  let users = [...existing]
  let changed = false
  if (!users.some(u => u.email === demoCredentials.email)) {
    users.push({
      ...demoUser,
      passwordHash: await demoPasswordHash(),
    })
    changed = true
  }
  if (!users.some(u => u.email === ADMIN_EMAIL)) {
    users.push({
      id: 'user-admin',
      email: ADMIN_EMAIL,
      passwordHash: await hashPassword('admin1234'),
      role: 'admin',
      profile: { ...demoUser.profile, name: 'Content Admin', language: 'en' },
      createdAt: new Date().toISOString(),
    })
    changed = true
  }
  if (changed) writeUsers(users)
  return users
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const seeded = await ensureSeedUsers()
        if (!mounted) return
        setUsers(seeded)
        const session = localStorage.getItem(SESSION_KEY)
        const match = seeded.find(u => u.id === session)
        if (match) setUser(match)
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => { mounted = false }
  }, [])

  const persistUsers = useCallback((next: User[]) => {
    setUsers(next)
    writeUsers(next)
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const normalised = email.trim().toLowerCase()
    const list = readUsers()
    const match = list.find(u => u.email.toLowerCase() === normalised)
    if (!match) return { ok: false, error: 'No account found with this email.' }
    if (!(await verifyPassword(password, match.passwordHash))) return { ok: false, error: 'Incorrect password. Try again.' }
    localStorage.setItem(SESSION_KEY, match.id)
    setUser(match)
    return { ok: true }
  }, [])

  const demoLogin = useCallback(async () => {
    let list = readUsers()
    if (!list.some(u => u.email === demoCredentials.email)) list = await ensureSeedUsers()
    const match = list.find(u => u.email === demoCredentials.email)!
    localStorage.setItem(SESSION_KEY, match.id)
    setUser(match)
    setUsers(list)
    return { ok: true }
  }, [])

  const register = useCallback(async (name: string, email: string, password: string) => {
    const normalised = email.trim().toLowerCase()
    if (!name.trim()) return { ok: false, error: 'Please enter your name.' }
    if (!/^\S+@\S+\.\S+$/.test(normalised)) return { ok: false, error: 'Enter a valid email address.' }
    if (password.length < 8) return { ok: false, error: 'Password must be at least 8 characters.' }
    const list = readUsers()
    if (list.some(u => u.email.toLowerCase() === normalised)) return { ok: false, error: 'An account with this email already exists.' }
    const newUser: User = {
      id: `user_${Date.now().toString(36)}`,
      email: normalised,
      passwordHash: await hashPassword(password),
      role: 'student',
      profile: emptyProfile(name.trim()),
      createdAt: new Date().toISOString(),
    }
    const next = [...list, newUser]
    persistUsers(next)
    localStorage.setItem(SESSION_KEY, newUser.id)
    setUser(newUser)
    return { ok: true }
  }, [persistUsers])

  const logout = useCallback(() => {
    localStorage.removeItem(SESSION_KEY)
    setUser(null)
  }, [])

  const updateProfile = useCallback((profile: Partial<StudyProfile>) => {
    setUser(prev => {
      if (!prev) return prev
      const next = { ...prev, profile: { ...prev.profile, ...profile } }
      const list = readUsers().map(u => u.id === next.id ? next : u)
      writeUsers(list)
      setUsers(list)
      return next
    })
  }, [])

  const changePassword = useCallback(async (currentPassword: string, newPassword: string) => {
    if (!user) return { ok: false, error: 'You are not signed in.' }
    if (newPassword.length < 8) return { ok: false, error: 'New password must be at least 8 characters.' }
    if (!(await verifyPassword(currentPassword, user.passwordHash))) return { ok: false, error: 'Current password is incorrect.' }
    const passwordHash = await hashPassword(newPassword)
    const next = { ...user, passwordHash }
    const list = readUsers().map(u => u.id === next.id ? next : u)
    writeUsers(list)
    setUsers(list)
    setUser(next)
    return { ok: true }
  }, [user])

  const setRole = useCallback((role: User['role']) => {
    setUser(prev => {
      if (!prev) return prev
      const next = { ...prev, role }
      const list = readUsers().map(u => u.id === next.id ? next : u)
      writeUsers(list)
      setUsers(list)
      return next
    })
  }, [])

  const value = useMemo<AuthContextValue>(() => ({
    user,
    users,
    loading,
    login,
    demoLogin,
    register,
    logout,
    updateProfile,
    changePassword,
    setRole,
    isAdmin: user?.role === 'admin',
  }), [user, users, loading, login, demoLogin, register, logout, updateProfile, changePassword, setRole])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}

export { ADMIN_EMAIL }
