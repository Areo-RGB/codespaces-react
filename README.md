# Live Yo-Yo Test Conductor

A sophisticated digital assistant for sports coaches to conduct the Yo-Yo Intermittent Recovery Test Level 1. This application transforms the manual, error-prone testing process into a synchronized, real-time, and data-driven experience.

## 🎯 Features

- **Real-time Test Conductor**: Synchronized timer with audio cues for precise test timing
- **Player Roster Management**: Add and manage athlete profiles
- **Live Session Management**: Multi-user support with real-time state synchronization
- **Performance Tracking**: Historical test results with VO₂ max calculations
- **Interactive Dashboard**: Visual progress charts and performance analytics
- **Mobile-First Design**: Responsive design optimized for tablets and mobile devices
- **Audio Cues**: Synchronized beeps for start, turn, and level transitions

## 🏃‍♂️ About the Yo-Yo Test

The Yo-Yo Intermittent Recovery Test Level 1 is a progressive shuttle run test that measures an athlete's ability to perform repeated high-intensity exercise. The test consists of:

- 20-meter shuttles with increasing speed across 20 levels
- 10-second recovery periods between levels
- Precise timing with audio cues
- Automatic VO₂ max calculation based on final distance

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account and project

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd live-yoyo-test-conductor
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` with your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=https://sxmdavslfhuednxrttwe.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN4bWRhdnNsZmh1ZWRueHJ0dHdlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk3OTE3ODEsImV4cCI6MjA2NTM2Nzc4MX0.fz6ChKy-IKgCmVINJIcnDy4j0HckO0UObBd0W-uO2Zk
   ```

4. **Set up the database**
   
   Install Supabase CLI:
   ```bash
   npm install -g @supabase/cli
   ```
   
   Apply the database migration:
   ```bash
   supabase db push --file ./supabase/migrations/20240101000000_initial_schema.sql
   ```

5. **Add audio files (optional)**
   
   Place audio files in the `public/audio/` directory:
   - `start_beep.mp3` - Test start sound
   - `turn_beep.mp3` - Shuttle turn sound
   - `level_complete.mp3` - Level completion sound
   - `recovery_start.mp3` - Recovery phase start
   - `recovery_end.mp3` - Recovery phase end
   
   The app will use generated beeps if audio files are not provided.

6. **Start the development server**
   ```bash
   npm start
   ```

The application will be available at `http://localhost:3000`.

## 📱 Usage

### 1. Roster Management
- Navigate to the **Roster** page
- Add new players with first and last names
- View player profiles and performance history

### 2. Conducting a Live Test
- Go to the **Conductor** page
- Create a new session or continue an existing one
- Select participants from your roster
- Start the test - the app will provide audio cues and track timing
- Use **Warn** and **Eliminate** buttons to manage participants during the test
- View real-time leaderboard of eliminated participants
- Finish the test to save results

### 3. Performance Analysis
- Click on any player in the roster to view their detailed performance history
- See progress charts showing distance and VO₂ max over time
- Track personal bests and improvements

## 🧪 Testing

Run the test suite to verify core functionality:

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Test Coverage

The test suite includes:
- **Core Logic Tests**: Yo-Yo test calculations, timing, and VO₂ max formulas
- **Component Tests**: User interface behavior and interactions
- **Integration Tests**: Database operations and real-time updates

## 🏗️ Architecture

### Frontend
- **React 18** with TypeScript for type safety
- **Vite** for fast development and building
- **Tailwind CSS** for responsive, mobile-first styling
- **React Router** for navigation
- **Chart.js** for performance visualization

### Backend & Database
- **Supabase** for database, authentication, and real-time subscriptions
- **PostgreSQL** with Row Level Security policies
- **Real-time updates** via Supabase's WebSocket connections

### Core Entities
- **Player**: Athlete profiles with performance history
- **Live Session**: Central test management with real-time state
- **Participant**: Player representation within a live session
- **Test Result**: Permanent performance records

## 🔧 Configuration

### Environment Variables
- `VITE_SUPABASE_URL`: Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY`: Your Supabase public API key

### Database Schema
The database schema is defined in `supabase/migrations/20240101000000_initial_schema.sql` and includes:
- Players table with initial roster data
- Test results for historical tracking
- Live sessions for test management
- Participants for session-specific player states

## 🚀 Deployment

### Build for Production
```bash
npm run build
```

### Preview Production Build
```bash
npm run preview
```

### Deploy to Vercel, Netlify, or similar
The built application in the `dist/` folder can be deployed to any static hosting service.

## 🛠️ Development

### File Structure
```
src/
├── components/          # Reusable UI components
├── pages/              # Page components
├── lib/                # Core logic and utilities
│   ├── yoyo-test.ts    # Test calculations and timing
│   ├── database.ts     # Supabase operations
│   ├── audio.ts        # Audio management
│   └── supabase.ts     # Database client setup
├── __tests__/          # Test files
└── main.tsx           # Application entry point
```

### Key Features Implementation
- **Real-time State**: Uses Supabase's real-time subscriptions for multi-user synchronization
- **Audio System**: Web Audio API with fallback generated beeps
- **Responsive Design**: Mobile-first Tailwind CSS implementation
- **State Management**: React hooks with centralized database operations

## 📚 References

- [Yo-Yo Intermittent Recovery Test Documentation](https://www.yoyotest.dk/)
- [Supabase Documentation](https://supabase.com/docs)
- [React Documentation](https://react.dev/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Yo-Yo Test protocol by Jens Bangsbo
- Audio cue timing based on official test specifications
- Chart.js for performance visualization
- Supabase for real-time backend infrastructure