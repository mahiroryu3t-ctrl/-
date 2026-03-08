/*
  # Rebuild database for two-user system

  1. Drop existing tables and policies
  2. Create simplified tables for mai and mahiro only
  3. Insert predefined users
  4. Set up simple RLS policies
  5. Create indexes for performance

  This migration completely rebuilds the database to handle only two predefined users:
  - mai (main_user): a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11
  - mahiro (supporter): b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12
*/

-- Drop all existing tables and start fresh
DROP TABLE IF EXISTS support_records CASCADE;
DROP TABLE IF EXISTS weight_records CASCADE;
DROP TABLE IF EXISTS meal_records CASCADE;
DROP TABLE IF EXISTS exercise_records CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- Drop trigger function if exists
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- Create trigger function for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create profiles table for two users only
CREATE TABLE profiles (
  id uuid PRIMARY KEY,
  email text UNIQUE NOT NULL,
  name text NOT NULL,
  role text NOT NULL CHECK (role IN ('main_user', 'supporter')),
  partner_id uuid REFERENCES profiles(id),
  target_weight numeric DEFAULT 50.0,
  start_date date DEFAULT CURRENT_DATE,
  target_date date DEFAULT (CURRENT_DATE + interval '90 days'),
  height integer DEFAULT 160,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create exercise records table
CREATE TABLE exercise_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  date date NOT NULL,
  steps integer DEFAULT 0,
  partner_steps integer DEFAULT 0,
  exercises jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, date)
);

-- Create meal records table
CREATE TABLE meal_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  date date NOT NULL,
  breakfast text,
  lunch text,
  dinner text,
  snack text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, date)
);

-- Create weight records table (only for main user)
CREATE TABLE weight_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  date date NOT NULL,
  weight numeric NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, date)
);

-- Create support records table
CREATE TABLE support_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  to_user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('like', 'comment')),
  message text,
  date date DEFAULT CURRENT_DATE,
  likes integer DEFAULT 0,
  liked_by jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Insert the two predefined users
INSERT INTO profiles (id, email, name, role, target_weight, start_date, target_date, height) VALUES
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'mai@example.com', 'まい', 'main_user', 50.0, '2024-01-01', '2024-03-14', 160),
  ('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', 'mahiro@example.com', 'まひろ', 'supporter', 65.0, '2024-01-01', '2024-03-14', 170)
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  target_weight = EXCLUDED.target_weight,
  start_date = EXCLUDED.start_date,
  target_date = EXCLUDED.target_date,
  height = EXCLUDED.height,
  updated_at = now();

-- Set partner relationships
UPDATE profiles SET partner_id = 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12' WHERE id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
UPDATE profiles SET partner_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11' WHERE id = 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12';

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercise_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE weight_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_records ENABLE ROW LEVEL SECURITY;

-- Create simple RLS policies for two users only
-- Profiles policies
CREATE POLICY "Allow two users to read all profiles"
  ON profiles FOR SELECT
  TO anon, authenticated
  USING (id IN ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12'));

CREATE POLICY "Allow two users to update own profile"
  ON profiles FOR UPDATE
  TO anon, authenticated
  USING (id IN ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12'))
  WITH CHECK (id IN ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12'));

-- Exercise records policies
CREATE POLICY "Allow two users to manage exercise records"
  ON exercise_records FOR ALL
  TO anon, authenticated
  USING (user_id IN ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12'))
  WITH CHECK (user_id IN ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12'));

-- Meal records policies
CREATE POLICY "Allow two users to manage meal records"
  ON meal_records FOR ALL
  TO anon, authenticated
  USING (user_id IN ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12'))
  WITH CHECK (user_id IN ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12'));

-- Weight records policies (only for mai)
CREATE POLICY "Allow mai to manage weight records"
  ON weight_records FOR ALL
  TO anon, authenticated
  USING (user_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11')
  WITH CHECK (user_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11');

-- Support records policies
CREATE POLICY "Allow two users to manage support records"
  ON support_records FOR ALL
  TO anon, authenticated
  USING (
    from_user_id IN ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12') OR
    to_user_id IN ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12')
  )
  WITH CHECK (
    from_user_id IN ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12') AND
    to_user_id IN ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12')
  );

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_exercise_records_updated_at
  BEFORE UPDATE ON exercise_records
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_meal_records_updated_at
  BEFORE UPDATE ON meal_records
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for performance
CREATE INDEX idx_exercise_records_user_date ON exercise_records(user_id, date DESC);
CREATE INDEX idx_meal_records_user_date ON meal_records(user_id, date DESC);
CREATE INDEX idx_weight_records_user_date ON weight_records(user_id, date DESC);
CREATE INDEX idx_support_records_to_user ON support_records(to_user_id, created_at DESC);

-- Insert some sample data for testing
INSERT INTO exercise_records (user_id, date, steps, partner_steps, exercises) VALUES
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', CURRENT_DATE, 8000, 6000, '[{"type": "腹筋", "reps": 20}, {"type": "スクワット", "reps": 15}]'::jsonb),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', CURRENT_DATE - 1, 7500, 5500, '[{"type": "プランク", "reps": 30}]'::jsonb)
ON CONFLICT (user_id, date) DO NOTHING;

INSERT INTO meal_records (user_id, date, breakfast, lunch, dinner) VALUES
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', CURRENT_DATE, 'ヨーグルトとフルーツ', 'サラダとチキン', '野菜炒めと玄米'),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', CURRENT_DATE - 1, 'オートミールとバナナ', '野菜スープ', '魚と野菜')
ON CONFLICT (user_id, date) DO NOTHING;

INSERT INTO weight_records (user_id, date, weight) VALUES
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', CURRENT_DATE, 52.5),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', CURRENT_DATE - 1, 52.8),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', CURRENT_DATE - 2, 53.0)
ON CONFLICT (user_id, date) DO NOTHING;

INSERT INTO support_records (from_user_id, to_user_id, type, message, date) VALUES
  ('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'comment', '今日も頑張ってるね！', CURRENT_DATE),
  ('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'like', NULL, CURRENT_DATE - 1)
ON CONFLICT DO NOTHING;