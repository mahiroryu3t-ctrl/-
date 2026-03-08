/*
  # ユーザー認証とダイエットアプリのデータベース設計

  1. New Tables
    - `profiles` - ユーザープロフィール情報
      - `id` (uuid, primary key, auth.users.idと連携)
      - `email` (text, unique)
      - `name` (text)
      - `role` (text, 'main_user' or 'supporter')
      - `partner_id` (uuid, パートナーのユーザーID)
      - `target_weight` (numeric)
      - `start_date` (date)
      - `target_date` (date)
      - `height` (integer)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `exercise_records` - 運動記録
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to profiles)
      - `date` (date)
      - `steps` (integer)
      - `partner_steps` (integer)
      - `exercises` (jsonb, 運動の配列)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `meal_records` - 食事記録
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to profiles)
      - `date` (date)
      - `breakfast` (text)
      - `lunch` (text)
      - `dinner` (text)
      - `snack` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `weight_records` - 体重記録
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to profiles)
      - `date` (date)
      - `weight` (numeric)
      - `created_at` (timestamp)

    - `support_records` - 応援記録
      - `id` (uuid, primary key)
      - `from_user_id` (uuid, foreign key to profiles)
      - `to_user_id` (uuid, foreign key to profiles)
      - `type` (text, 'like' or 'comment')
      - `message` (text)
      - `date` (date)
      - `likes` (integer, default 0)
      - `liked_by` (jsonb, いいねしたユーザーIDの配列)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to access their own data and partner's data
    - Profiles are readable by authenticated users, writable by owner
    - Records are accessible by user and their partner
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  name text NOT NULL,
  role text NOT NULL CHECK (role IN ('main_user', 'supporter')),
  partner_id uuid REFERENCES profiles(id),
  target_weight numeric DEFAULT 50.0,
  start_date date DEFAULT CURRENT_DATE,
  target_date date DEFAULT (CURRENT_DATE + INTERVAL '90 days'),
  height integer DEFAULT 160,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create exercise_records table
CREATE TABLE IF NOT EXISTS exercise_records (
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

-- Create meal_records table
CREATE TABLE IF NOT EXISTS meal_records (
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

-- Create weight_records table
CREATE TABLE IF NOT EXISTS weight_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  date date NOT NULL,
  weight numeric NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, date)
);

-- Create support_records table
CREATE TABLE IF NOT EXISTS support_records (
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

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercise_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE weight_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_records ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can read all profiles"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Exercise records policies
CREATE POLICY "Users can read own and partner's exercise records"
  ON exercise_records
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR 
    user_id IN (
      SELECT partner_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own exercise records"
  ON exercise_records
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own exercise records"
  ON exercise_records
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own exercise records"
  ON exercise_records
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Meal records policies
CREATE POLICY "Users can read own and partner's meal records"
  ON meal_records
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR 
    user_id IN (
      SELECT partner_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own meal records"
  ON meal_records
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own meal records"
  ON meal_records
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own meal records"
  ON meal_records
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Weight records policies (only main_user can access)
CREATE POLICY "Main users can read own weight records"
  ON weight_records
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() AND 
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'main_user'
    )
  );

CREATE POLICY "Main users can insert own weight records"
  ON weight_records
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid() AND 
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'main_user'
    )
  );

CREATE POLICY "Main users can update own weight records"
  ON weight_records
  FOR UPDATE
  TO authenticated
  USING (
    user_id = auth.uid() AND 
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'main_user'
    )
  );

CREATE POLICY "Main users can delete own weight records"
  ON weight_records
  FOR DELETE
  TO authenticated
  USING (
    user_id = auth.uid() AND 
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'main_user'
    )
  );

-- Support records policies
CREATE POLICY "Users can read support records for themselves"
  ON support_records
  FOR SELECT
  TO authenticated
  USING (
    from_user_id = auth.uid() OR 
    to_user_id = auth.uid()
  );

CREATE POLICY "Users can insert support records"
  ON support_records
  FOR INSERT
  TO authenticated
  WITH CHECK (from_user_id = auth.uid());

CREATE POLICY "Users can update support records they created"
  ON support_records
  FOR UPDATE
  TO authenticated
  USING (from_user_id = auth.uid());

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_exercise_records_user_date ON exercise_records(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_meal_records_user_date ON meal_records(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_weight_records_user_date ON weight_records(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_support_records_to_user ON support_records(to_user_id, created_at DESC);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_exercise_records_updated_at
  BEFORE UPDATE ON exercise_records
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();