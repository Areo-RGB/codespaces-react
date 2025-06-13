import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'
import { Line } from 'react-chartjs-2'
import { getPlayerWithResults, getPlayerTestResults } from '../lib/database'
import { Player, TestResult } from '../lib/supabase'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
)

const PlayerDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const [player, setPlayer] = useState<Player | null>(null)
  const [testResults, setTestResults] = useState<TestResult[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (id) {
      loadPlayerData(id)
    }
  }, [id])

  const loadPlayerData = async (playerId: string) => {
    try {
      const [playerData, resultsData] = await Promise.all([
        getPlayerWithResults(playerId),
        getPlayerTestResults(playerId)
      ])
      
      setPlayer(playerData)
      setTestResults(resultsData)
    } catch (error) {
      console.error('Error loading player data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getPlayerDisplayName = (player: Player) => {
    if (player.last_name === '-') {
      return player.first_name
    }
    return `${player.first_name} ${player.last_name}`
  }

  const getPerformanceStats = () => {
    if (testResults.length === 0) return null

    const distances = testResults.map(r => r.distance_meters)
    const vo2Values = testResults.map(r => r.vo2_max).filter(v => v !== null) as number[]
    
    return {
      bestDistance: Math.max(...distances),
      averageDistance: Math.round(distances.reduce((a, b) => a + b, 0) / distances.length),
      bestVO2: vo2Values.length > 0 ? Math.max(...vo2Values) : 0,
      averageVO2: vo2Values.length > 0 ? Math.round((vo2Values.reduce((a, b) => a + b, 0) / vo2Values.length) * 100) / 100 : 0,
      totalTests: testResults.length,
      improvement: distances.length >= 2 ? distances[0] - distances[distances.length - 1] : 0
    }
  }

  const getChartData = () => {
    const sortedResults = [...testResults].reverse() // Show chronological order
    
    return {
      labels: sortedResults.map((_, index) => `Test ${index + 1}`),
      datasets: [
        {
          label: 'Distance (meters)',
          data: sortedResults.map(r => r.distance_meters),
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          tension: 0.1,
          yAxisID: 'y',
        },
        {
          label: 'VO₂ Max',
          data: sortedResults.map(r => r.vo2_max),
          borderColor: 'rgb(16, 185, 129)',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          tension: 0.1,
          yAxisID: 'y1',
        },
      ],
    }
  }

  const chartOptions = {
    responsive: true,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: 'rgb(203, 213, 225)'
        }
      },
      title: {
        display: true,
        text: 'Performance Progress',
        color: 'rgb(203, 213, 225)'
      },
    },
    scales: {
      x: {
        display: true,
        title: {
          display: true,
          text: 'Test Session',
          color: 'rgb(203, 213, 225)'
        },
        ticks: {
          color: 'rgb(148, 163, 184)'
        },
        grid: {
          color: 'rgba(148, 163, 184, 0.2)'
        }
      },
      y: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
        title: {
          display: true,
          text: 'Distance (meters)',
          color: 'rgb(59, 130, 246)'
        },
        ticks: {
          color: 'rgb(59, 130, 246)'
        },
        grid: {
          color: 'rgba(59, 130, 246, 0.2)'
        }
      },
      y1: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        title: {
          display: true,
          text: 'VO₂ Max (ml/kg/min)',
          color: 'rgb(16, 185, 129)'
        },
        ticks: {
          color: 'rgb(16, 185, 129)'
        },
        grid: {
          drawOnChartArea: false,
          color: 'rgba(16, 185, 129, 0.2)'
        },
      },
    },
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-slate-400">Loading player details...</div>
      </div>
    )
  }

  if (!player) {
    return (
      <div className="max-w-2xl mx-auto text-center">
        <h1 className="text-3xl font-bold text-white mb-6">Player Not Found</h1>
        <Link
          to="/roster"
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-md font-medium transition-colors"
        >
          Back to Roster
        </Link>
      </div>
    )
  }

  const stats = getPerformanceStats()

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">
            {getPlayerDisplayName(player)}
          </h1>
          <p className="text-slate-400">
            Player since {new Date(player.created_at).toLocaleDateString()}
          </p>
        </div>
        <Link
          to="/roster"
          className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-md font-medium transition-colors"
        >
          ← Back to Roster
        </Link>
      </div>

      {stats && (
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-slate-900 p-4 rounded-lg border border-slate-800">
            <div className="text-2xl font-bold text-white">{stats.bestDistance}m</div>
            <div className="text-slate-400 text-sm">Best Distance</div>
          </div>
          <div className="bg-slate-900 p-4 rounded-lg border border-slate-800">
            <div className="text-2xl font-bold text-white">{stats.bestVO2}</div>
            <div className="text-slate-400 text-sm">Best VO₂ Max</div>
          </div>
          <div className="bg-slate-900 p-4 rounded-lg border border-slate-800">
            <div className="text-2xl font-bold text-white">{stats.averageDistance}m</div>
            <div className="text-slate-400 text-sm">Average Distance</div>
          </div>
          <div className="bg-slate-900 p-4 rounded-lg border border-slate-800">
            <div className="text-2xl font-bold text-white">{stats.totalTests}</div>
            <div className="text-slate-400 text-sm">Total Tests</div>
          </div>
        </div>
      )}

      {testResults.length > 0 && (
        <div className="bg-slate-900 p-6 rounded-lg border border-slate-800 mb-6">
          <h2 className="text-xl font-semibold text-white mb-4">Performance Chart</h2>
          <div className="h-96">
            <Line data={getChartData()} options={chartOptions} />
          </div>
        </div>
      )}

      <div className="bg-slate-900 rounded-lg border border-slate-800">
        <div className="p-6 border-b border-slate-800">
          <h2 className="text-xl font-semibold text-white">
            Test History ({testResults.length} tests)
          </h2>
        </div>
        
        {testResults.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-slate-800">
                <tr>
                  <th className="text-left p-4 text-slate-300 font-medium">Date</th>
                  <th className="text-left p-4 text-slate-300 font-medium">Distance</th>
                  <th className="text-left p-4 text-slate-300 font-medium">VO₂ Max</th>
                  <th className="text-left p-4 text-slate-300 font-medium">Performance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {testResults.map((result, index) => {
                  const isPersonalBest = stats && result.distance_meters === stats.bestDistance
                  return (
                    <tr key={result.id} className="hover:bg-slate-800">
                      <td className="p-4 text-slate-300">
                        {new Date(result.test_date).toLocaleDateString()}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center space-x-2">
                          <span className="text-white font-medium">
                            {result.distance_meters}m
                          </span>
                          {isPersonalBest && (
                            <span className="bg-yellow-900 text-yellow-200 px-2 py-1 rounded text-xs font-medium">
                              PB
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-4 text-slate-300">
                        {result.vo2_max?.toFixed(1) || 'N/A'}
                      </td>
                      <td className="p-4">
                        <div className="w-full bg-slate-700 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{
                              width: `${stats ? (result.distance_meters / stats.bestDistance) * 100 : 0}%`
                            }}
                          ></div>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-6 text-center text-slate-400">
            No test results yet. Participate in a live test to see your performance history.
          </div>
        )}
      </div>

      {stats && stats.improvement !== 0 && (
        <div className="mt-6 bg-slate-900 p-4 rounded-lg border border-slate-800">
          <div className="flex items-center justify-center space-x-2">
            <span className="text-slate-400">Latest improvement:</span>
            <span className={`font-medium ${
              stats.improvement > 0 ? 'text-green-400' : 'text-red-400'
            }`}>
              {stats.improvement > 0 ? '+' : ''}{stats.improvement}m
              {stats.improvement > 0 ? ' 📈' : ' 📉'}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

export default PlayerDetailsPage