import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Navigation from './components/Navigation'
import HomePage from './pages/HomePage'
import RosterPage from './pages/RosterPage'
import ConductorPage from './pages/ConductorPage'
import PlayerDetailsPage from './pages/PlayerDetailsPage'

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-slate-950 text-white">
        <Navigation />
        <main className="container mx-auto px-4 py-6">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/roster" element={<RosterPage />} />
            <Route path="/conductor" element={<ConductorPage />} />
            <Route path="/player/:id" element={<PlayerDetailsPage />} />
          </Routes>
        </main>
      </div>
    </Router>
  )
}

export default App