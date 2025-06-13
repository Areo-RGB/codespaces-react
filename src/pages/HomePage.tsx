import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getCurrentSession, createSession } from '../lib/database'
import { LiveSession } from '../lib/supabase'

const HomePage: React.FC = () => {
  const [currentSession, setCurrentSession] = useState<LiveSession | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isCreatingSession, setIsCreatingSession] = useState(false)

  useEffect(() => {
    loadCurrentSession()
  }, [])

  const loadCurrentSession = async () => {
    try {
      const session = await getCurrentSession()
      setCurrentSession(session)
    } catch (error) {
      console.error('Error loading session:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateSession = async () => {
    setIsCreatingSession(true)
    try {
      const newSession = await createSession()
      setCurrentSession(newSession)
    } catch (error) {
      console.error('Error creating session:', error)
    } finally {
      setIsCreatingSession(false)
    }
  }

  const getSessionStatusBadge = (status: string) => {
    const badges = {
      idle: 'bg-yellow-900 text-yellow-200',
      active: 'bg-green-900 text-green-200',
      finished: 'bg-gray-700 text-gray-300'
    }
    return badges[status as keyof typeof badges] || badges.idle
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-slate-400">Loading...</div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-white mb-4">
          Live Yo-Yo Test Conductor
        </h1>
        <p className="text-slate-400 text-lg max-w-2xl mx-auto">
          Transform your manual Yo-Yo Intermittent Recovery Test Level 1 into a synchronized, 
          real-time, and data-driven experience. Manage your roster, conduct live tests, 
          and track performance progress.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <div className="bg-slate-900 p-6 rounded-lg border border-slate-800">
          <h2 className="text-xl font-semibold text-white mb-4">Current Session</h2>
          {currentSession ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Status:</span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getSessionStatusBadge(currentSession.status)}`}>
                  {currentSession.status.toUpperCase()}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Created:</span>
                <span className="text-slate-300">
                  {new Date(currentSession.created_at).toLocaleDateString()}
                </span>
              </div>
              {currentSession.status === 'idle' && (
                <Link
                  to="/conductor"
                  className="block w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md text-center font-medium transition-colors"
                >
                  Continue to Conductor
                </Link>
              )}
              {currentSession.status === 'active' && (
                <Link
                  to="/conductor"
                  className="block w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-md text-center font-medium transition-colors"
                >
                  Return to Active Test
                </Link>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-slate-400">No active session found</p>
              <button
                onClick={handleCreateSession}
                disabled={isCreatingSession}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:text-slate-400 text-white py-2 px-4 rounded-md font-medium transition-colors"
              >
                {isCreatingSession ? 'Creating...' : 'Create New Session'}
              </button>
            </div>
          )}
        </div>

        <div className="bg-slate-900 p-6 rounded-lg border border-slate-800">
          <h2 className="text-xl font-semibold text-white mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <Link
              to="/roster"
              className="block w-full bg-slate-800 hover:bg-slate-700 text-white py-3 px-4 rounded-md text-center font-medium transition-colors"
            >
              👥 Manage Player Roster
            </Link>
            <Link
              to="/conductor"
              className="block w-full bg-slate-800 hover:bg-slate-700 text-white py-3 px-4 rounded-md text-center font-medium transition-colors"
            >
              🎯 Live Test Conductor
            </Link>
          </div>
        </div>
      </div>

      <div className="bg-slate-900 p-6 rounded-lg border border-slate-800">
        <h2 className="text-xl font-semibold text-white mb-4">About the Yo-Yo Test</h2>
        <div className="text-slate-400 space-y-3">
          <p>
            The Yo-Yo Intermittent Recovery Test Level 1 is a progressive shuttle run test 
            that measures an athlete's ability to perform repeated high-intensity exercise.
          </p>
          <ul className="list-disc list-inside space-y-1">
            <li>20-meter shuttles with increasing speed</li>
            <li>10-second recovery periods between levels</li>
            <li>Synchronized audio cues for precise timing</li>
            <li>Automatic VO₂ max calculation</li>
            <li>Real-time performance tracking</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default HomePage