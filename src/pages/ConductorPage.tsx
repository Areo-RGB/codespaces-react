import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  getCurrentSession, 
  createSession, 
  startSession, 
  finishSession,
  addParticipant,
  getSessionParticipants,
  warnParticipant,
  eliminateParticipant,
  finalizeParticipants,
  getAllPlayers,
  subscribeToSession
} from '../lib/database'
import { LiveSession, Participant, Player } from '../lib/supabase'
import { getTestStateAtTime, getAudioCues, AudioCue, calculateVO2Max } from '../lib/yoyo-test'
import { audioManager } from '../lib/audio'

const ConductorPage: React.FC = () => {
  const navigate = useNavigate()
  const [session, setSession] = useState<LiveSession | null>(null)
  const [participants, setParticipants] = useState<Participant[]>([])
  const [players, setPlayers] = useState<Player[]>([])
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [elapsedTime, setElapsedTime] = useState(0)
  const [isRunning, setIsRunning] = useState(false)
  const [startTime, setStartTime] = useState<number | null>(null)
  const [audioCues, setAudioCues] = useState<AudioCue[]>([])
  const [nextCueIndex, setNextCueIndex] = useState(0)
  const [showPlayerSelection, setShowPlayerSelection] = useState(false)
  
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const subscriptionRef = useRef<any>(null)

  useEffect(() => {
    loadInitialData()
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      if (subscriptionRef.current) subscriptionRef.current.unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (session && session.status === 'active') {
      subscribeToSessionUpdates()
    }
  }, [session])

  useEffect(() => {
    if (isRunning && audioCues.length > 0) {
      checkAudioCues()
    }
  }, [elapsedTime, audioCues, nextCueIndex, isRunning])

  const loadInitialData = async () => {
    try {
      const [sessionData, playersData] = await Promise.all([
        getCurrentSession(),
        getAllPlayers()
      ])
      
      setSession(sessionData)
      setPlayers(playersData)
      
      if (sessionData) {
        const participantsData = await getSessionParticipants(sessionData.id)
        setParticipants(participantsData)
        
        if (sessionData.status === 'active' && sessionData.started_at) {
          const now = Date.now()
          const startedAt = new Date(sessionData.started_at).getTime()
          const elapsed = Math.floor((now - startedAt) / 1000)
          setElapsedTime(elapsed)
          setStartTime(startedAt)
          setIsRunning(true)
          setupTimer()
          
          const cues = getAudioCues(3600)
          setAudioCues(cues)
          
          const passedCues = cues.filter(cue => cue.time <= elapsed).length
          setNextCueIndex(passedCues)
        }
      }
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const subscribeToSessionUpdates = () => {
    if (!session) return
    
    subscriptionRef.current = subscribeToSession(session.id, (payload) => {
      if (payload.table === 'participants') {
        loadParticipants()
      } else if (payload.table === 'live_sessions') {
        loadSession()
      }
    })
  }

  const loadParticipants = async () => {
    if (!session) return
    try {
      const participantsData = await getSessionParticipants(session.id)
      setParticipants(participantsData)
    } catch (error) {
      console.error('Error loading participants:', error)
    }
  }

  const loadSession = async () => {
    if (!session) return
    try {
      const sessionData = await getCurrentSession()
      if (sessionData) {
        setSession(sessionData)
      }
    } catch (error) {
      console.error('Error loading session:', error)
    }
  }

  const setupTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current)
    
    timerRef.current = setInterval(() => {
      if (startTime) {
        const now = Date.now()
        const elapsed = Math.floor((now - startTime) / 1000)
        setElapsedTime(elapsed)
      }
    }, 100)
  }

  const checkAudioCues = async () => {
    if (nextCueIndex < audioCues.length) {
      const nextCue = audioCues[nextCueIndex]
      if (elapsedTime >= nextCue.time) {
        await audioManager.playSound(nextCue.type === 'level_complete' ? 'turn' : nextCue.type)
        setNextCueIndex(nextCueIndex + 1)
      }
    }
  }

  const handleCreateSession = async () => {
    try {
      const newSession = await createSession()
      setSession(newSession)
      setParticipants([])
      setShowPlayerSelection(true)
    } catch (error) {
      console.error('Error creating session:', error)
    }
  }

  const handleAddParticipants = async () => {
    if (!session || selectedPlayers.length === 0) return
    
    try {
      const newParticipants = await Promise.all(
        selectedPlayers.map(playerId => addParticipant(session.id, playerId))
      )
      
      setParticipants([...participants, ...newParticipants])
      setSelectedPlayers([])
      setShowPlayerSelection(false)
    } catch (error) {
      console.error('Error adding participants:', error)
    }
  }

  const handleStartSession = async () => {
    if (!session) return
    
    try {
      await audioManager.ensureAudioReady()
      
      const updatedSession = await startSession(session.id)
      setSession(updatedSession)
      
      const now = Date.now()
      setStartTime(now)
      setElapsedTime(0)
      setIsRunning(true)
      
      const cues = getAudioCues(3600)
      setAudioCues(cues)
      setNextCueIndex(0)
      
      setupTimer()
      
      setTimeout(() => {
        audioManager.playSound('start')
      }, 1000)
    } catch (error) {
      console.error('Error starting session:', error)
    }
  }

  const handleFinishSession = async () => {
    if (!session) return
    
    try {
      setIsRunning(false)
      if (timerRef.current) clearInterval(timerRef.current)
      
      await finalizeParticipants(session.id)
      await finishSession(session.id)
      
      navigate('/')
    } catch (error) {
      console.error('Error finishing session:', error)
    }
  }

  const handleWarnParticipant = async (participantId: string) => {
    try {
      await warnParticipant(participantId)
    } catch (error) {
      console.error('Error warning participant:', error)
    }
  }

  const handleEliminateParticipant = async (participantId: string) => {
    const testState = getTestStateAtTime(elapsedTime)
    try {
      await eliminateParticipant(participantId, testState.distance)
    } catch (error) {
      console.error('Error eliminating participant:', error)
    }
  }

  const getActiveParticipants = () => {
    return participants.filter(p => p.status === 'active' || p.status === 'warned')
  }

  const getEliminatedParticipants = () => {
    return participants
      .filter(p => p.status === 'eliminated')
      .sort((a, b) => (b.elimination_distance || 0) - (a.elimination_distance || 0))
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const testState = getTestStateAtTime(elapsedTime)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-slate-400">Loading conductor...</div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="max-w-2xl mx-auto text-center">
        <h1 className="text-3xl font-bold text-white mb-6">Live Test Conductor</h1>
        <div className="bg-slate-900 p-8 rounded-lg border border-slate-800">
          <p className="text-slate-400 mb-6">No active session found. Create a new session to begin.</p>
          <button
            onClick={handleCreateSession}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-md font-medium transition-colors"
          >
            Create New Session
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-white">Live Test Conductor</h1>
        <div className="text-right">
          <div className="text-sm text-slate-400">Session Status</div>
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${
            session.status === 'active' ? 'bg-green-900 text-green-200' :
            session.status === 'idle' ? 'bg-yellow-900 text-yellow-200' :
            'bg-gray-700 text-gray-300'
          }`}>
            {session.status.toUpperCase()}
          </div>
        </div>
      </div>

      {session.status === 'active' && (
        <div className="bg-slate-900 p-6 rounded-lg border border-slate-800 mb-6">
          <div className="grid md:grid-cols-4 gap-6 text-center">
            <div>
              <div className="text-3xl font-bold text-white">{formatTime(elapsedTime)}</div>
              <div className="text-slate-400">Time Elapsed</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-white">{testState.level}</div>
              <div className="text-slate-400">Current Level</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-white">{testState.shuttle}</div>
              <div className="text-slate-400">Shuttle</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-white">{testState.distance}m</div>
              <div className="text-slate-400">Distance</div>
            </div>
          </div>
          {testState.isRecoveryPhase && (
            <div className="mt-4 text-center">
              <span className="bg-yellow-900 text-yellow-200 px-3 py-1 rounded-full text-sm font-medium">
                🕐 Recovery Phase
              </span>
            </div>
          )}
        </div>
      )}

      {showPlayerSelection && (
        <div className="bg-slate-900 p-6 rounded-lg border border-slate-800 mb-6">
          <h2 className="text-xl font-semibold text-white mb-4">Select Participants</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
            {players.map((player) => (
              <label
                key={player.id}
                className="flex items-center space-x-3 p-3 bg-slate-800 rounded-md cursor-pointer hover:bg-slate-700"
              >
                <input
                  type="checkbox"
                  checked={selectedPlayers.includes(player.id)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedPlayers([...selectedPlayers, player.id])
                    } else {
                      setSelectedPlayers(selectedPlayers.filter(id => id !== player.id))
                    }
                  }}
                  className="rounded border-slate-600 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-white">
                  {player.last_name === '-' ? player.first_name : `${player.first_name} ${player.last_name}`}
                </span>
              </label>
            ))}
          </div>
          <div className="flex space-x-3">
            <button
              onClick={handleAddParticipants}
              disabled={selectedPlayers.length === 0}
              className="bg-green-600 hover:bg-green-700 disabled:bg-slate-700 disabled:text-slate-400 text-white px-4 py-2 rounded-md font-medium transition-colors"
            >
              Add Selected ({selectedPlayers.length})
            </button>
            <button
              onClick={() => setShowPlayerSelection(false)}
              className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-md font-medium transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-slate-900 rounded-lg border border-slate-800">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-white">
              Active Participants ({getActiveParticipants().length})
            </h2>
            {session.status === 'idle' && (
              <button
                onClick={() => setShowPlayerSelection(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm font-medium transition-colors"
              >
                Add Players
              </button>
            )}
          </div>
          <div className="p-4 space-y-3">
            {getActiveParticipants().map((participant) => (
              <div
                key={participant.id}
                className="flex items-center justify-between p-3 bg-slate-800 rounded-md"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-slate-700 rounded-full flex items-center justify-center">
                    <span className="text-slate-300 text-sm font-medium">
                      {participant.player?.first_name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <div className="text-white font-medium">
                      {participant.player?.last_name === '-' 
                        ? participant.player?.first_name 
                        : `${participant.player?.first_name} ${participant.player?.last_name}`}
                    </div>
                    {participant.status === 'warned' && (
                      <span className="text-yellow-400 text-sm">⚠️ Warned</span>
                    )}
                  </div>
                </div>
                {session.status === 'active' && (
                  <div className="flex space-x-2">
                    {participant.status === 'active' && (
                      <button
                        onClick={() => handleWarnParticipant(participant.id)}
                        className="bg-yellow-600 hover:bg-yellow-700 text-white px-2 py-1 rounded text-sm font-medium transition-colors"
                      >
                        Warn
                      </button>
                    )}
                    <button
                      onClick={() => handleEliminateParticipant(participant.id)}
                      className="bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded text-sm font-medium transition-colors"
                    >
                      Eliminate
                    </button>
                  </div>
                )}
              </div>
            ))}
            {getActiveParticipants().length === 0 && (
              <div className="text-center text-slate-400 py-8">
                No active participants
              </div>
            )}
          </div>
        </div>

        <div className="bg-slate-900 rounded-lg border border-slate-800">
          <div className="p-4 border-b border-slate-800">
            <h2 className="text-xl font-semibold text-white">
              Results Leaderboard ({getEliminatedParticipants().length})
            </h2>
          </div>
          <div className="p-4">
            {getEliminatedParticipants().length > 0 ? (
              <div className="space-y-2">
                {getEliminatedParticipants().map((participant, index) => (
                  <div
                    key={participant.id}
                    className="flex items-center justify-between p-3 bg-slate-800 rounded-md"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-6 h-6 bg-slate-700 rounded-full flex items-center justify-center">
                        <span className="text-slate-300 text-xs font-bold">
                          {index + 1}
                        </span>
                      </div>
                      <div className="text-white">
                        {participant.player?.last_name === '-' 
                          ? participant.player?.first_name 
                          : `${participant.player?.first_name} ${participant.player?.last_name}`}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-white font-medium">
                        {participant.elimination_distance}m
                      </div>
                      <div className="text-slate-400 text-sm">
                        VO₂: {calculateVO2Max(participant.elimination_distance || 0).toFixed(1)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-slate-400 py-8">
                No eliminated participants yet
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-6 text-center">
        {session.status === 'idle' && participants.length > 0 && (
          <button
            onClick={handleStartSession}
            className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-md font-medium text-lg transition-colors"
          >
            🚀 Start Test
          </button>
        )}
        {session.status === 'active' && (
          <button
            onClick={handleFinishSession}
            className="bg-red-600 hover:bg-red-700 text-white px-8 py-3 rounded-md font-medium text-lg transition-colors"
          >
            🏁 Finish Test
          </button>
        )}
      </div>
    </div>
  )
}

export default ConductorPage