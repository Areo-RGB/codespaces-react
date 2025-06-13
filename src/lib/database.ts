import { supabase, Player, TestResult, LiveSession, Participant } from './supabase'

/**
 * Database operations for the Yo-Yo Test application
 */

export class DatabaseError extends Error {
  constructor(message: string, public originalError?: any) {
    super(message)
    this.name = 'DatabaseError'
  }
}

// Player operations
export async function getAllPlayers(): Promise<Player[]> {
  const { data, error } = await supabase
    .from('players')
    .select('*')
    .order('first_name')

  if (error) throw new DatabaseError('Failed to fetch players', error)
  return data || []
}

export async function createPlayer(firstName: string, lastName: string = '-'): Promise<Player> {
  const { data, error } = await supabase
    .from('players')
    .insert({ first_name: firstName, last_name: lastName })
    .select()
    .single()

  if (error) throw new DatabaseError('Failed to create player', error)
  return data
}

export async function getPlayerWithResults(playerId: string): Promise<Player & { test_results: TestResult[] }> {
  const { data, error } = await supabase
    .from('players')
    .select(`
      *,
      test_results:test_results(*)
    `)
    .eq('id', playerId)
    .single()

  if (error) throw new DatabaseError('Failed to fetch player with results', error)
  return data
}

// Test Results operations
export async function createTestResult(
  playerId: string,
  distanceMeters: number,
  vo2Max: number
): Promise<TestResult> {
  const { data, error } = await supabase
    .from('test_results')
    .insert({
      player_id: playerId,
      distance_meters: distanceMeters,
      vo2_max: vo2Max
    })
    .select()
    .single()

  if (error) throw new DatabaseError('Failed to create test result', error)
  return data
}

export async function getPlayerTestResults(playerId: string): Promise<TestResult[]> {
  const { data, error } = await supabase
    .from('test_results')
    .select('*')
    .eq('player_id', playerId)
    .order('test_date', { ascending: false })

  if (error) throw new DatabaseError('Failed to fetch test results', error)
  return data || []
}

// Live Session operations
export async function getCurrentSession(): Promise<LiveSession | null> {
  const { data, error } = await supabase
    .from('live_sessions')
    .select('*')
    .in('status', ['active', 'idle'])
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) throw new DatabaseError('Failed to fetch current session', error)
  return data
}

export async function createSession(): Promise<LiveSession> {
  // First, finish any existing active sessions
  await supabase
    .from('live_sessions')
    .update({ status: 'finished', finished_at: new Date().toISOString() })
    .eq('status', 'active')

  const { data, error } = await supabase
    .from('live_sessions')
    .insert({ status: 'idle' })
    .select()
    .single()

  if (error) throw new DatabaseError('Failed to create session', error)
  return data
}

export async function startSession(sessionId: string): Promise<LiveSession> {
  const { data, error } = await supabase
    .from('live_sessions')
    .update({ 
      status: 'active', 
      started_at: new Date().toISOString() 
    })
    .eq('id', sessionId)
    .select()
    .single()

  if (error) throw new DatabaseError('Failed to start session', error)
  return data
}

export async function finishSession(sessionId: string): Promise<LiveSession> {
  const { data, error } = await supabase
    .from('live_sessions')
    .update({ 
      status: 'finished', 
      finished_at: new Date().toISOString() 
    })
    .eq('id', sessionId)
    .select()
    .single()

  if (error) throw new DatabaseError('Failed to finish session', error)
  return data
}

// Participant operations
export async function addParticipant(sessionId: string, playerId: string): Promise<Participant> {
  const { data, error } = await supabase
    .from('participants')
    .insert({
      session_id: sessionId,
      player_id: playerId,
      status: 'active'
    })
    .select(`
      *,
      player:players(*)
    `)
    .single()

  if (error) throw new DatabaseError('Failed to add participant', error)
  return data
}

export async function getSessionParticipants(sessionId: string): Promise<Participant[]> {
  const { data, error } = await supabase
    .from('participants')
    .select(`
      *,
      player:players(*)
    `)
    .eq('session_id', sessionId)
    .order('created_at')

  if (error) throw new DatabaseError('Failed to fetch participants', error)
  return data || []
}

export async function warnParticipant(participantId: string): Promise<Participant> {
  const { data, error } = await supabase
    .from('participants')
    .update({ 
      status: 'warned',
      warned_at: new Date().toISOString()
    })
    .eq('id', participantId)
    .select(`
      *,
      player:players(*)
    `)
    .single()

  if (error) throw new DatabaseError('Failed to warn participant', error)
  return data
}

export async function eliminateParticipant(
  participantId: string, 
  eliminationDistance: number
): Promise<Participant> {
  const { data, error } = await supabase
    .from('participants')
    .update({ 
      status: 'eliminated',
      elimination_distance: eliminationDistance,
      eliminated_at: new Date().toISOString()
    })
    .eq('id', participantId)
    .select(`
      *,
      player:players(*)
    `)
    .single()

  if (error) throw new DatabaseError('Failed to eliminate participant', error)
  return data
}

export async function finalizeParticipants(sessionId: string): Promise<TestResult[]> {
  // Get all eliminated participants
  const { data: participants, error: participantsError } = await supabase
    .from('participants')
    .select(`
      *,
      player:players(*)
    `)
    .eq('session_id', sessionId)
    .eq('status', 'eliminated')

  if (participantsError) throw new DatabaseError('Failed to fetch participants for finalization', participantsError)
  
  const testResults: TestResult[] = []
  
  // Create test results for each eliminated participant
  for (const participant of participants || []) {
    if (participant.elimination_distance) {
      const vo2Max = participant.elimination_distance * 0.0084 + 36.4
      
      const { data: testResult, error: resultError } = await supabase
        .from('test_results')
        .insert({
          player_id: participant.player_id,
          distance_meters: participant.elimination_distance,
          vo2_max: Math.round(vo2Max * 100) / 100
        })
        .select(`
          *,
          player:players(*)
        `)
        .single()

      if (resultError) throw new DatabaseError('Failed to create test result', resultError)
      testResults.push(testResult)
    }
  }

  return testResults
}

// Real-time subscriptions
export function subscribeToSession(
  sessionId: string,
  callback: (payload: any) => void
) {
  return supabase
    .channel(`session_${sessionId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'participants',
        filter: `session_id=eq.${sessionId}`
      },
      callback
    )
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'live_sessions',
        filter: `id=eq.${sessionId}`
      },
      callback
    )
    .subscribe()
}