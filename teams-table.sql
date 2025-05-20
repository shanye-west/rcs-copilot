-- Teams table for Rowdy Cup
CREATE TABLE IF NOT EXISTS teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  color TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert the two teams
INSERT INTO teams (name, color)
VALUES
  ('The Producers', 'red'),
  ('The Aviators', 'blue')
ON CONFLICT (name) DO NOTHING;
