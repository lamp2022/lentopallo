import { supabase } from './supabase'
import type { Session } from '@supabase/supabase-js'

const redirectUrl = import.meta.env.VITE_REDIRECT_URL as string || `${window.location.origin}${import.meta.env.BASE_URL}`

export async function sendMagicLink(email: string): Promise<{ error: Error | null }> {
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: false,
      emailRedirectTo: redirectUrl,
    },
  })
  return { error: error ? new Error(error.message) : null }
}

export async function signInWithPassword(email: string, password: string): Promise<{ error: Error | null }> {
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  return { error: error ? new Error(error.message) : null }
}

export async function signOutUser(): Promise<void> {
  await supabase.auth.signOut()
}

export async function getCurrentSession(): Promise<Session | null> {
  const { data } = await supabase.auth.getSession()
  return data.session
}
