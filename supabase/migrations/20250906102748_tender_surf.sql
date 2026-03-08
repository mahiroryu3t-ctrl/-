/*
  # Insert predefined user profiles

  1. New Records
    - Insert 'mai' user with UUID a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11
    - Insert 'mahiro' user with UUID b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12
  
  2. User Details
    - mai: main_user role with target weight 50kg
    - mahiro: supporter role, partnered with mai
    
  3. Security
    - Uses INSERT ON CONFLICT to handle existing records
    - Maintains foreign key relationships
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
  CURRENT_DATE,
  CURRENT_DATE + INTERVAL '90 days',
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
  CURRENT_DATE,
  CURRENT_DATE + INTERVAL '90 days',
  165,
  now(),
  now()
)
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  partner_id = EXCLUDED.partner_id,
  updated_at = now();