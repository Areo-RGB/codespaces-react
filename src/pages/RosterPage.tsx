import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getAllPlayers, createPlayer } from '../lib/database'
import { Player } from '../lib/supabase'

const RosterPage: React.FC = () => {
  const [players, setPlayers] = useState<Player[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newPlayerForm, setNewPlayerForm] = useState({
    firstName: '',
    lastName: ''
  })

  useEffect(() => {
    loadPlayers()
  }, [])

  const loadPlayers = async () => {
    try {
      const playersData = await getAllPlayers()
      setPlayers(playersData)
    } catch (error) {
      console.error('Error loading players:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddPlayer = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newPlayerForm.firstName.trim()) return

    setIsCreating(true)
    try {
      const newPlayer = await createPlayer(
        newPlayerForm.firstName.trim(),
        newPlayerForm.lastName.trim() || '-'
      )
      setPlayers([...players, newPlayer])
      setNewPlayerForm({ firstName: '', lastName: '' })
      setShowAddForm(false)
    } catch (error) {
      console.error('Error creating player:', error)
    } finally {
      setIsCreating(false)
    }
  }

  const getPlayerDisplayName = (player: Player) => {
    if (player.last_name === '-') {
      return player.first_name
    }
    return `${player.first_name} ${player.last_name}`
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-slate-400">Loading roster...</div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-white">Player Roster</h1>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium transition-colors"
        >
          ➕ Add Player
        </button>
      </div>

      {showAddForm && (
        <div className="bg-slate-900 p-6 rounded-lg border border-slate-800 mb-6">
          <h2 className="text-xl font-semibold text-white mb-4">Add New Player</h2>
          <form onSubmit={handleAddPlayer} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-slate-300 mb-2">
                  First Name *
                </label>
                <input
                  type="text"
                  id="firstName"
                  value={newPlayerForm.firstName}
                  onChange={(e) => setNewPlayerForm({ ...newPlayerForm, firstName: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter first name"
                  required
                />
              </div>
              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-slate-300 mb-2">
                  Last Name
                </label>
                <input
                  type="text"
                  id="lastName"
                  value={newPlayerForm.lastName}
                  onChange={(e) => setNewPlayerForm({ ...newPlayerForm, lastName: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter last name (optional)"
                />
              </div>
            </div>
            <div className="flex space-x-3">
              <button
                type="submit"
                disabled={isCreating || !newPlayerForm.firstName.trim()}
                className="bg-green-600 hover:bg-green-700 disabled:bg-slate-700 disabled:text-slate-400 text-white px-4 py-2 rounded-md font-medium transition-colors"
              >
                {isCreating ? 'Adding...' : 'Add Player'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAddForm(false)
                  setNewPlayerForm({ firstName: '', lastName: '' })
                }}
                className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-md font-medium transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-slate-900 rounded-lg border border-slate-800">
        <div className="p-6 border-b border-slate-800">
          <h2 className="text-xl font-semibold text-white">
            All Players ({players.length})
          </h2>
        </div>
        
        {players.length === 0 ? (
          <div className="p-6 text-center text-slate-400">
            No players in the roster yet. Add your first player to get started.
          </div>
        ) : (
          <div className="divide-y divide-slate-800">
            {players.map((player) => (
              <div
                key={player.id}
                className="p-4 hover:bg-slate-800 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-slate-700 rounded-full flex items-center justify-center">
                      <span className="text-slate-300 font-medium">
                        {player.first_name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-white font-medium">
                        {getPlayerDisplayName(player)}
                      </h3>
                      <p className="text-slate-400 text-sm">
                        Added {new Date(player.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Link
                      to={`/player/${player.id}`}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm font-medium transition-colors"
                    >
                      View History
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-6 text-center">
        <Link
          to="/conductor"
          className="inline-flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-md font-medium transition-colors"
        >
          <span>🎯</span>
          <span>Start Live Test</span>
        </Link>
      </div>
    </div>
  )
}

export default RosterPage