/*
  # Create daily messages table

  1. New Tables
    - `daily_messages`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to profiles)
      - `date` (date)
      - `message` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `daily_messages` table
    - Add policy for predefined users to manage daily messages
    - Add policy for both users to read all daily messages

  3. Constraints
    - Unique constraint on user_id and date (one message per user per day)
*/

CREATE TABLE IF NOT EXISTS daily_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  date date NOT NULL,
  message text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, date)
);

ALTER TABLE daily_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow predefined users full access to daily messages"
  ON daily_messages
  FOR ALL
  TO anon, authenticated
  USING (user_id = ANY (ARRAY['a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid, 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12'::uuid]))
  WITH CHECK (user_id = ANY (ARRAY['a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid, 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12'::uuid]));

CREATE POLICY "Allow both users to read all daily messages"
  ON daily_messages
  FOR SELECT
  TO anon, authenticated
  USING (user_id = ANY (ARRAY['a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid, 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12'::uuid]));

CREATE TRIGGER update_daily_messages_updated_at
  BEFORE UPDATE ON daily_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_daily_messages_user_date ON daily_messages(user_id, date DESC);