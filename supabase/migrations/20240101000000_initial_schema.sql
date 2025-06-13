-- Create Players table
CREATE TABLE players (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL DEFAULT '-',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Test Results table
CREATE TABLE test_results (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    distance_meters INTEGER NOT NULL,
    vo2_max DECIMAL(5,2),
    test_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Live Sessions table
CREATE TABLE live_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    status TEXT NOT NULL DEFAULT 'idle' CHECK (status IN ('idle', 'active', 'finished')),
    started_at TIMESTAMP WITH TIME ZONE,
    finished_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Participants table (ephemeral data during live sessions)
CREATE TABLE participants (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id UUID NOT NULL REFERENCES live_sessions(id) ON DELETE CASCADE,
    player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'warned', 'eliminated')),
    elimination_distance INTEGER,
    warned_at TIMESTAMP WITH TIME ZONE,
    eliminated_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(session_id, player_id)
);

-- Create indexes for better performance
CREATE INDEX idx_test_results_player_id ON test_results(player_id);
CREATE INDEX idx_test_results_test_date ON test_results(test_date);
CREATE INDEX idx_participants_session_id ON participants(session_id);
CREATE INDEX idx_participants_player_id ON participants(player_id);
CREATE INDEX idx_live_sessions_status ON live_sessions(status);

-- Enable Row Level Security
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE live_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (adjust based on your security requirements)
CREATE POLICY "Players are publicly readable" ON players FOR SELECT USING (true);
CREATE POLICY "Players are publicly writable" ON players FOR INSERT WITH CHECK (true);
CREATE POLICY "Players are publicly updatable" ON players FOR UPDATE USING (true);

CREATE POLICY "Test results are publicly readable" ON test_results FOR SELECT USING (true);
CREATE POLICY "Test results are publicly writable" ON test_results FOR INSERT WITH CHECK (true);

CREATE POLICY "Live sessions are publicly readable" ON live_sessions FOR SELECT USING (true);
CREATE POLICY "Live sessions are publicly writable" ON live_sessions FOR INSERT WITH CHECK (true);
CREATE POLICY "Live sessions are publicly updatable" ON live_sessions FOR UPDATE USING (true);

CREATE POLICY "Participants are publicly readable" ON participants FOR SELECT USING (true);
CREATE POLICY "Participants are publicly writable" ON participants FOR INSERT WITH CHECK (true);
CREATE POLICY "Participants are publicly updatable" ON participants FOR UPDATE USING (true);
CREATE POLICY "Participants are publicly deletable" ON participants FOR DELETE USING (true);

-- Seed the players table with initial roster
INSERT INTO players (first_name, last_name) VALUES
    ('Silas', '-'),
    ('Finley', '-'),
    ('Iraklis', '-'),
    ('Orestis', '-'),
    ('Erik', '-'),
    ('Arvid', '-'),
    ('Lion', '-'),
    ('Jakob', '-'),
    ('Paul', '-'),
    ('Levi', '-'),
    ('Lasse', '-'),
    ('Nicklas', '-'),
    ('Carl', '-'),
    ('Kayden', '-'),
    ('Jan', '-'),
    ('Lennox', '-'),
    ('Errey', '-'),
    ('Jounes', '-'),
    ('Spieler1', '-'),
    ('Spieler2', '-');