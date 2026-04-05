import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../supabase', () => ({
  supabase: {
    from: vi.fn(),
    auth: { getSession: vi.fn() },
  },
}))

import { fetchTeams, fetchUserProfile } from '../teams'
import { supabase } from '../supabase'

describe('fetchTeams', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('returns teams on success', async () => {
    const mockData = [{ id: '1', name: 'Team A', season: '2026' }]
    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({ data: mockData, error: null }),
      }),
    } as any)
    const teams = await fetchTeams()
    expect(teams).toEqual(mockData)
    expect(supabase.from).toHaveBeenCalledWith('teams')
  })

  it('returns empty array on error', async () => {
    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({ data: null, error: { message: 'err' } }),
      }),
    } as any)
    const teams = await fetchTeams()
    expect(teams).toEqual([])
  })
})

describe('fetchUserProfile', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('returns profile on success', async () => {
    const mockProfile = { club_id: 'club-1', role: 'coach', display_name: 'Test User' }
    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: mockProfile, error: null }),
        }),
      }),
    } as any)
    const profile = await fetchUserProfile('user-1')
    expect(profile).toEqual(mockProfile)
    expect(supabase.from).toHaveBeenCalledWith('profiles')
  })

  it('returns null on error', async () => {
    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: null, error: { message: 'not found' } }),
        }),
      }),
    } as any)
    const profile = await fetchUserProfile('bad-id')
    expect(profile).toBeNull()
  })
})
