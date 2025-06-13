import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import ConductorPage from '../../pages/ConductorPage'
import * as database from '../../lib/database'

// Mock the database module
vi.mock('../../lib/database', () => ({
  getCurrentSession: vi.fn(),
  createSession: vi.fn(),
  startSession: vi.fn(),
  finishSession: vi.fn(),
  addParticipant: vi.fn(),
  getSessionParticipants: vi.fn(),
  warnParticipant: vi.fn(),
  eliminateParticipant: vi.fn(),
  finalizeParticipants: vi.fn(),
  getAllPlayers: vi.fn(),
  subscribeToSession: vi.fn(() => ({ unsubscribe: vi.fn() }))
}))

// Mock the audio manager
vi.mock('../../lib/audio', () => ({
  audioManager: {
    ensureAudioReady: vi.fn(),
    playSound: vi.fn()
  }
}))

// Mock Chart.js components
vi.mock('react-chartjs-2', () => ({
  Line: () => <div data-testid="chart">Chart Component</div>
}))

const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  )
}

const mockSession = {
  id: 'session-1',
  status: 'idle' as const,
  started_at: null,
  finished_at: null,
  created_at: '2024-01-01T00:00:00Z'
}

const mockPlayers = [
  {
    id: 'player-1',
    first_name: 'John',
    last_name: 'Doe',
    created_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 'player-2',
    first_name: 'Jane',
    last_name: 'Smith',
    created_at: '2024-01-01T00:00:00Z'
  }
]

const mockParticipants = [
  {
    id: 'participant-1',
    session_id: 'session-1',
    player_id: 'player-1',
    status: 'active' as const,
    elimination_distance: null,
    warned_at: null,
    eliminated_at: null,
    created_at: '2024-01-01T00:00:00Z',
    player: mockPlayers[0]
  }
]

describe('ConductorPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    // Setup default mocks
    vi.mocked(database.getCurrentSession).mockResolvedValue(mockSession)
    vi.mocked(database.getAllPlayers).mockResolvedValue(mockPlayers)
    vi.mocked(database.getSessionParticipants).mockResolvedValue([])
  })

  afterEach(() => {
    vi.clearAllTimers()
    vi.useRealTimers()
  })

  describe('Initial Loading State', () => {
    it('should show loading state initially', () => {
      vi.mocked(database.getCurrentSession).mockImplementation(() => new Promise(() => {}))
      
      renderWithRouter(<ConductorPage />)
      
      expect(screen.getByText('Loading conductor...')).toBeInTheDocument()
    })
  })

  describe('No Session State', () => {
    it('should show create session option when no session exists', async () => {
      vi.mocked(database.getCurrentSession).mockResolvedValue(null)
      
      renderWithRouter(<ConductorPage />)
      
      await waitFor(() => {
        expect(screen.getByText('No active session found. Create a new session to begin.')).toBeInTheDocument()
        expect(screen.getByText('Create New Session')).toBeInTheDocument()
      })
    })

    it('should create new session when button is clicked', async () => {
      vi.mocked(database.getCurrentSession).mockResolvedValue(null)
      vi.mocked(database.createSession).mockResolvedValue(mockSession)
      
      renderWithRouter(<ConductorPage />)
      
      await waitFor(() => {
        expect(screen.getByText('Create New Session')).toBeInTheDocument()
      })
      
      fireEvent.click(screen.getByText('Create New Session'))
      
      await waitFor(() => {
        expect(database.createSession).toHaveBeenCalled()
      })
    })
  })

  describe('Idle Session State', () => {
    it('should show session details and participant management', async () => {
      renderWithRouter(<ConductorPage />)
      
      await waitFor(() => {
        expect(screen.getByText('Live Test Conductor')).toBeInTheDocument()
        expect(screen.getByText('IDLE')).toBeInTheDocument()
        expect(screen.getByText('Active Participants (0)')).toBeInTheDocument()
        expect(screen.getByText('Add Players')).toBeInTheDocument()
      })
    })

    it('should show player selection when Add Players is clicked', async () => {
      renderWithRouter(<ConductorPage />)
      
      await waitFor(() => {
        expect(screen.getByText('Add Players')).toBeInTheDocument()
      })
      
      fireEvent.click(screen.getByText('Add Players'))
      
      await waitFor(() => {
        expect(screen.getByText('Select Participants')).toBeInTheDocument()
        expect(screen.getByText('John Doe')).toBeInTheDocument()
        expect(screen.getByText('Jane Smith')).toBeInTheDocument()
      })
    })

    it('should add selected participants', async () => {
      vi.mocked(database.addParticipant).mockResolvedValue(mockParticipants[0])
      
      renderWithRouter(<ConductorPage />)
      
      await waitFor(() => {
        expect(screen.getByText('Add Players')).toBeInTheDocument()
      })
      
      fireEvent.click(screen.getByText('Add Players'))
      
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument()
      })
      
      // Select a player
      const checkbox = screen.getByRole('checkbox', { name: /john doe/i })
      fireEvent.click(checkbox)
      
      // Add selected players
      fireEvent.click(screen.getByText('Add Selected (1)'))
      
      await waitFor(() => {
        expect(database.addParticipant).toHaveBeenCalledWith('session-1', 'player-1')
      })
    })

    it('should show start test button when participants are added', async () => {
      vi.mocked(database.getSessionParticipants).mockResolvedValue(mockParticipants)
      
      renderWithRouter(<ConductorPage />)
      
      await waitFor(() => {
        expect(screen.getByText('🚀 Start Test')).toBeInTheDocument()
      })
    })
  })

  describe('Active Session State', () => {
    beforeEach(() => {
      vi.useFakeTimers()
      
      const activeSession = {
        ...mockSession,
        status: 'active' as const,
        started_at: new Date().toISOString()
      }
      
      vi.mocked(database.getCurrentSession).mockResolvedValue(activeSession)
      vi.mocked(database.getSessionParticipants).mockResolvedValue(mockParticipants)
    })

    it('should show test progress and controls', async () => {
      renderWithRouter(<ConductorPage />)
      
      await waitFor(() => {
        expect(screen.getByText('ACTIVE')).toBeInTheDocument()
        expect(screen.getByText('Time Elapsed')).toBeInTheDocument()
        expect(screen.getByText('Current Level')).toBeInTheDocument()
        expect(screen.getByText('Shuttle')).toBeInTheDocument()
        expect(screen.getByText('Distance')).toBeInTheDocument()
      })
    })

    it('should show participant controls during active test', async () => {
      renderWithRouter(<ConductorPage />)
      
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument()
        expect(screen.getByText('Warn')).toBeInTheDocument()
        expect(screen.getByText('Eliminate')).toBeInTheDocument()
      })
    })

    it('should warn participant when Warn button is clicked', async () => {
      renderWithRouter(<ConductorPage />)
      
      await waitFor(() => {
        expect(screen.getByText('Warn')).toBeInTheDocument()
      })
      
      fireEvent.click(screen.getByText('Warn'))
      
      await waitFor(() => {
        expect(database.warnParticipant).toHaveBeenCalledWith('participant-1')
      })
    })

    it('should eliminate participant when Eliminate button is clicked', async () => {
      renderWithRouter(<ConductorPage />)
      
      await waitFor(() => {
        expect(screen.getByText('Eliminate')).toBeInTheDocument()
      })
      
      fireEvent.click(screen.getByText('Eliminate'))
      
      await waitFor(() => {
        expect(database.eliminateParticipant).toHaveBeenCalledWith('participant-1', expect.any(Number))
      })
    })

    it('should show finish test button during active session', async () => {
      renderWithRouter(<ConductorPage />)
      
      await waitFor(() => {
        expect(screen.getByText('🏁 Finish Test')).toBeInTheDocument()
      })
    })
  })

  describe('Results Leaderboard', () => {
    it('should show eliminated participants sorted by distance', async () => {
      const eliminatedParticipants = [
        {
          ...mockParticipants[0],
          status: 'eliminated' as const,
          elimination_distance: 200
        },
        {
          id: 'participant-2',
          session_id: 'session-1',
          player_id: 'player-2',
          status: 'eliminated' as const,
          elimination_distance: 300,
          warned_at: null,
          eliminated_at: '2024-01-01T00:01:00Z',
          created_at: '2024-01-01T00:00:00Z',
          player: mockPlayers[1]
        }
      ]
      
      vi.mocked(database.getSessionParticipants).mockResolvedValue(eliminatedParticipants)
      
      renderWithRouter(<ConductorPage />)
      
      await waitFor(() => {
        expect(screen.getByText('Results Leaderboard (2)')).toBeInTheDocument()
        expect(screen.getByText('Jane Smith')).toBeInTheDocument()
        expect(screen.getByText('300m')).toBeInTheDocument()
        expect(screen.getByText('John Doe')).toBeInTheDocument()
        expect(screen.getByText('200m')).toBeInTheDocument()
      })
      
      // Verify sorting (Jane with 300m should be first)
      const leaderboardItems = screen.getAllByText(/^\d+$/)
      expect(leaderboardItems[0]).toHaveTextContent('1')
      expect(leaderboardItems[1]).toHaveTextContent('2')
    })

    it('should calculate and display VO2 max for eliminated participants', async () => {
      const eliminatedParticipant = {
        ...mockParticipants[0],
        status: 'eliminated' as const,
        elimination_distance: 500
      }
      
      vi.mocked(database.getSessionParticipants).mockResolvedValue([eliminatedParticipant])
      
      renderWithRouter(<ConductorPage />)
      
      await waitFor(() => {
        // VO2 max for 500m should be 500 * 0.0084 + 36.4 = 40.6
        expect(screen.getByText('VO₂: 40.6')).toBeInTheDocument()
      })
    })
  })

  describe('Session Management', () => {
    it('should start session when Start Test is clicked', async () => {
      vi.mocked(database.getSessionParticipants).mockResolvedValue(mockParticipants)
      vi.mocked(database.startSession).mockResolvedValue({
        ...mockSession,
        status: 'active',
        started_at: new Date().toISOString()
      })
      
      renderWithRouter(<ConductorPage />)
      
      await waitFor(() => {
        expect(screen.getByText('🚀 Start Test')).toBeInTheDocument()
      })
      
      fireEvent.click(screen.getByText('🚀 Start Test'))
      
      await waitFor(() => {
        expect(database.startSession).toHaveBeenCalledWith('session-1')
      })
    })

    it('should finish session and redirect when Finish Test is clicked', async () => {
      const activeSession = {
        ...mockSession,
        status: 'active' as const,
        started_at: new Date().toISOString()
      }
      
      vi.mocked(database.getCurrentSession).mockResolvedValue(activeSession)
      vi.mocked(database.getSessionParticipants).mockResolvedValue(mockParticipants)
      
      renderWithRouter(<ConductorPage />)
      
      await waitFor(() => {
        expect(screen.getByText('🏁 Finish Test')).toBeInTheDocument()
      })
      
      fireEvent.click(screen.getByText('🏁 Finish Test'))
      
      await waitFor(() => {
        expect(database.finalizeParticipants).toHaveBeenCalledWith('session-1')
        expect(database.finishSession).toHaveBeenCalledWith('session-1')
      })
    })
  })
})