import type { User } from '../types'

const enc = new TextEncoder()

export async function hashPassword(password: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', enc.encode(`upsc-mentor::${password}`))
  return Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, '0')).join('')
}

export async function verifyPassword(password: string, hash: string) {
  return (await hashPassword(password)) === hash
}

export const USERS_KEY = 'upsc-mentor:users'
export const SESSION_KEY = 'upsc-mentor:session'
export const DATA_PREFIX = 'upsc-mentor:data:'

export function readUsers(): User[] {
  try {
    const raw = localStorage.getItem(USERS_KEY)
    return raw ? (JSON.parse(raw) as User[]) : []
  } catch {
    return []
  }
}

export function writeUsers(users: User[]) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users))
}
