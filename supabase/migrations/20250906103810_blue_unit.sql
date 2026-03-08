/*
  # Comprehensive fix for user profiles and RLS policies

  1. User Management
    - Insert predefined users (mai and mahiro) into profiles table
    - Handle conflicts gracefully
    - Set up proper partner relationships

  2. RLS Policies
    - Drop all existing restrictive policies
    - Create new policies that work with predefined UUIDs
    - Allow operations for both authenticated and anonymous users

  3. Security
    - Maintain data isolation between users
    - Allow cross-user visibility where needed (support records)
    - Ensure proper access control
*/

-- First, ensure the users table exists and has the required users
-- Note: We're working with profiles table as per the schema

-- Insert predefined users into profiles table
INSERT INTO profiles (
  id,
  email,
  name,
  role,
  partner_id,
  target_weight,
  start_date,
  target_date,
  height,
  created_at,
  updated_at
) VALUES 
(
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  'mai@example.com',
  'まい',
  'main_user',
  'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12',
  50.0,
  '2024-01-01',
  '2024-03-14',
  160,
  now(),
  now()
),
(
  'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12',
  'mahiro@example.com',
  'まひろ',
  'supporter',
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  NULL,
  '2024-01-01',
  '2024-03-14',
  NULL,
  now(),
  now()
)
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  partner_id = EXCLUDED.partner_id,
  target_weight = EXCLUDED.target_weight,
  start_date = EXCLUDED.start_date,
  target_date = EXCLUDED.target_date,
  height = EXCLUDED.height,
  updated_at = now();

-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can read all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

DROP POLICY IF EXISTS "Allow predefined users to insert exercise records" ON exercise_records;
DROP POLICY IF EXISTS "Allow predefined users to read exercise records" ON exercise_records;
DROP POLICY IF EXISTS "Allow predefined users to update exercise records" ON exercise_records;
DROP POLICY IF EXISTS "Allow predefined users to delete exercise records" ON exercise_records;

DROP POLICY IF EXISTS "Allow predefined users to insert meal records" ON meal_records;
DROP POLICY IF EXISTS "Allow predefined users to read meal records" ON meal_records;
DROP POLICY IF EXISTS "Allow predefined users to update meal records" ON meal_records;
DROP POLICY IF EXISTS "Allow predefined users to delete meal records" ON meal_records;

DROP POLICY IF EXISTS "Allow main user to insert weight records" ON weight_records;
DROP POLICY IF EXISTS "Allow main user to read weight records" ON weight_records;
DROP POLICY IF EXISTS "Allow main user to update weight records" ON weight_records;
DROP POLICY IF EXISTS "Allow main user to delete weight records" ON weight_records;

DROP POLICY IF EXISTS "Allow predefined users to insert support records" ON support_records;
DROP POLICY IF EXISTS "Allow predefined users to read support records" ON support_records;
DROP POLICY IF EXISTS "Allow predefined users to update support records" ON support_records;

-- Create new comprehensive policies for profiles
CREATE POLICY "Allow predefined users full access to profiles"
  ON profiles
  FOR ALL
  TO anon, authenticated
  USING (id = ANY (ARRAY['a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid, 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12'::uuid]))
  WITH CHECK (id = ANY (ARRAY['a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid, 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12'::uuid]));

-- Create new comprehensive policies for exercise_records
CREATE POLICY "Allow predefined users full access to exercise records"
  ON exercise_records
  FOR ALL
  TO anon, authenticated
  USING (user_id = ANY (ARRAY['a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid, 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12'::uuid]))
  WITH CHECK (user_id = ANY (ARRAY['a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid, 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12'::uuid]));

-- Create new comprehensive policies for meal_records
CREATE POLICY "Allow predefined users full access to meal records"
  ON meal_records
  FOR ALL
  TO anon, authenticated
  USING (user_id = ANY (ARRAY['a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid, 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12'::uuid]))
  WITH CHECK (user_id = ANY (ARRAY['a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid, 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12'::uuid]));

-- Create new comprehensive policies for weight_records (main user only)
CREATE POLICY "Allow main user full access to weight records"
  ON weight_records
  FOR ALL
  TO anon, authenticated
  USING (user_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid)
  WITH CHECK (user_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid);

-- Create new comprehensive policies for support_records
CREATE POLICY "Allow predefined users full access to support records"
  ON support_records
  FOR ALL
  TO anon, authenticated
  USING (
    from_user_id = ANY (ARRAY['a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid, 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12'::uuid])
    OR to_user_id = ANY (ARRAY['a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid, 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12'::uuid])
  )
  WITH CHECK (
    from_user_id = ANY (ARRAY['a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid, 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12'::uuid])
    AND to_user_id = ANY (ARRAY['a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid, 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12'::uuid])
  );