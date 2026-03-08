/*
  # Ensure predefined users exist in profiles table

  1. New Records
    - Insert predefined users 'mai' and 'mahiro' with their specific UUIDs
    - Set up proper profile data including email, name, role, and partner relationships
    - Configure default diet settings (target weight, dates, height)

  2. Data Integrity
    - Use INSERT ... ON CONFLICT DO NOTHING to avoid duplicate key errors
    - Ensure foreign key constraints are satisfied for exercise_records table
    - Set up bidirectional partner relationships

  3. User Configuration
    - mai: main_user with UUID a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11
    - mahiro: supporter with UUID b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12
    - Both users linked as partners
*/

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
  55.0,
  '2024-01-01',
  '2024-03-14',
  165,
  now(),
  now()
)
ON CONFLICT (id) DO NOTHING;