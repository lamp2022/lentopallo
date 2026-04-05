import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock supabase before importing auth
vi.mock('../supabase', () => ({
  supabase: {
    auth: {
      signInWithOtp: vi.fn(),
      signOut: vi.fn(),
      getSession: vi.fn(),
    },
  },
}))

import { sendMagicLink, signOutUser, getCurrentSession } from '../auth'
import { supabase } from '../supabase'

describe('sendMagicLink', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('calls signInWithOtp with shouldCreateUser:false', async () => {
    vi.mocked(supabase.auth.signInWithOtp).mockResolvedValue({ data: {}, error: null } as any)
    const result = await sendMagicLink('test@example.com')
    expect(supabase.auth.signInWithOtp).toHaveBeenCalledWith({
      email: 'test@example.com',
      options: expect.objectContaining({ shouldCreateUser: false }),
    })
    expect(result.error).toBeNull()
  })

  it('returns error on failure', async () => {
    vi.mocked(supabase.auth.signInWithOtp).mockResolvedValue({ data: {}, error: { message: 'fail' } } as any)
    const result = await sendMagicLink('bad@example.com')
    expect(result.error).toBeInstanceOf(Error)
    expect(result.error!.message).toBe('fail')
  })
})

describe('signOutUser', () => {
  it('calls supabase.auth.signOut', async () => {
    vi.mocked(supabase.auth.signOut).mockResolvedValue({ error: null } as any)
    await signOutUser()
    expect(supabase.auth.signOut).toHaveBeenCalled()
  })
})

describe('getCurrentSession', () => {
  it('returns session when authenticated', async () => {
    const mockSession = { user: { id: 'user-1' }, access_token: 'token' }
    vi.mocked(supabase.auth.getSession).mockResolvedValue({ data: { session: mockSession }, error: null } as any)
    const session = await getCurrentSession()
    expect(session).toEqual(mockSession)
  })

  it('returns null when not authenticated', async () => {
    vi.mocked(supabase.auth.getSession).mockResolvedValue({ data: { session: null }, error: null } as any)
    const session = await getCurrentSession()
    expect(session).toBeNull()
  })
})
