import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database type definitions
export interface Player {
  id: string
  first_name: string
  last_name: string
  created_at: string
}

export interface TestResult {
  id: string
  player_id: string
  distance_meters: number
  vo2_max: number | null
  test_date: string
  created_at: string
  player?: Player
}

export interface LiveSession {
  id: string
  status: 'idle' | 'active' | 'finished'
  started_at: string | null
  finished_at: string | null
  created_at: string
}

export interface Participant {
  id: string
  session_id: string
  player_id: string
  status: 'active' | 'warned' | 'eliminated'
  elimination_distance: number | null
  warned_at: string | null
  eliminated_at: string | null
  created_at: string
  player?: Player
}