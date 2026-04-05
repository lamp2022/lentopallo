import { supabase } from './supabase'

export interface TeamRow {
  id: string
  name: string
  season: string | null
}

export interface UserProfile {
  club_id: string | null
  role: 'admin' | 'coach' | 'viewer'
  display_name: string | null
}

export async function fetchTeams(): Promise<TeamRow[]> {
  const { data, error } = await supabase
    .from('teams')
    .select('id, name, season')
    .order('name')
  if (error) return []
  return data ?? []
}

export async function fetchUserProfile(userId: string): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('club_id, role, display_name')
    .eq('id', userId)
    .single()
  if (error || !data) return null
  return data as UserProfile
}
