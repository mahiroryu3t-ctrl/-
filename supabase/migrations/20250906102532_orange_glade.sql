/*
  # Fix RLS policies for predefined users

  1. Security Updates
    - Update RLS policies to work with predefined user IDs
    - Allow operations for 'mai' and 'mahiro' UUIDs
    - Maintain data security while enabling functionality

  2. Changes
    - Drop existing restrictive policies
    - Create new policies that allow predefined user operations
    - Apply to all record tables (exercise, meal, weight, support)
*/

-- Drop existing policies that rely on auth.uid()
DROP POLICY IF EXISTS "Users can insert own exercise records" ON exercise_records;
DROP POLICY IF EXISTS "Users can read own and partner's exercise records" ON exercise_records;
DROP POLICY IF EXISTS "Users can update own exercise records" ON exercise_records;
DROP POLICY IF EXISTS "Users can delete own exercise records" ON exercise_records;

DROP POLICY IF EXISTS "Users can insert own meal records" ON meal_records;
DROP POLICY IF EXISTS "Users can read own and partner's meal records" ON meal_records;
DROP POLICY IF EXISTS "Users can update own meal records" ON meal_records;
DROP POLICY IF EXISTS "Users can delete own meal records" ON meal_records;

DROP POLICY IF EXISTS "Main users can insert own weight records" ON weight_records;
DROP POLICY IF EXISTS "Main users can read own weight records" ON weight_records;
DROP POLICY IF EXISTS "Main users can update own weight records" ON weight_records;
DROP POLICY IF EXISTS "Main users can delete own weight records" ON weight_records;

DROP POLICY IF EXISTS "Users can insert support records" ON support_records;
DROP POLICY IF EXISTS "Users can read support records for themselves" ON support_records;
DROP POLICY IF EXISTS "Users can update support records they created" ON support_records;

-- Create new policies for predefined users
-- Exercise Records Policies
CREATE POLICY "Allow predefined users to insert exercise records"
  ON exercise_records
  FOR INSERT
  TO authenticated, anon
  WITH CHECK (user_id IN ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12'));

CREATE POLICY "Allow predefined users to read exercise records"
  ON exercise_records
  FOR SELECT
  TO authenticated, anon
  USING (user_id IN ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12'));

CREATE POLICY "Allow predefined users to update exercise records"
  ON exercise_records
  FOR UPDATE
  TO authenticated, anon
  USING (user_id IN ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12'))
  WITH CHECK (user_id IN ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12'));

CREATE POLICY "Allow predefined users to delete exercise records"
  ON exercise_records
  FOR DELETE
  TO authenticated, anon
  USING (user_id IN ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12'));

-- Meal Records Policies
CREATE POLICY "Allow predefined users to insert meal records"
  ON meal_records
  FOR INSERT
  TO authenticated, anon
  WITH CHECK (user_id IN ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12'));

CREATE POLICY "Allow predefined users to read meal records"
  ON meal_records
  FOR SELECT
  TO authenticated, anon
  USING (user_id IN ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12'));

CREATE POLICY "Allow predefined users to update meal records"
  ON meal_records
  FOR UPDATE
  TO authenticated, anon
  USING (user_id IN ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12'))
  WITH CHECK (user_id IN ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12'));

CREATE POLICY "Allow predefined users to delete meal records"
  ON meal_records
  FOR DELETE
  TO authenticated, anon
  USING (user_id IN ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12'));

-- Weight Records Policies (only for main user 'mai')
CREATE POLICY "Allow main user to insert weight records"
  ON weight_records
  FOR INSERT
  TO authenticated, anon
  WITH CHECK (user_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11');

CREATE POLICY "Allow main user to read weight records"
  ON weight_records
  FOR SELECT
  TO authenticated, anon
  USING (user_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11');

CREATE POLICY "Allow main user to update weight records"
  ON weight_records
  FOR UPDATE
  TO authenticated, anon
  USING (user_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11')
  WITH CHECK (user_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11');

CREATE POLICY "Allow main user to delete weight records"
  ON weight_records
  FOR DELETE
  TO authenticated, anon
  USING (user_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11');

-- Support Records Policies
CREATE POLICY "Allow predefined users to insert support records"
  ON support_records
  FOR INSERT
  TO authenticated, anon
  WITH CHECK (
    from_user_id IN ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12') AND
    to_user_id IN ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12')
  );

CREATE POLICY "Allow predefined users to read support records"
  ON support_records
  FOR SELECT
  TO authenticated, anon
  USING (
    from_user_id IN ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12') OR
    to_user_id IN ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12')
  );

CREATE POLICY "Allow predefined users to update support records"
  ON support_records
  FOR UPDATE
  TO authenticated, anon
  USING (from_user_id IN ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12'))
  WITH CHECK (from_user_id IN ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12'));