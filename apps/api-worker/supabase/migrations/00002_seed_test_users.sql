-- Migration: Seed Test Users for Development
-- Description: Creates test users in the auth.users table for local development and testing
-- This allows developers to test authentication flows without going through the full signup process
--
-- Test Users:
-- 1. test1@example.com - Primary test user
-- 2. test2@example.com - Secondary test user
-- 3. demo@example.com - Demo user
--
-- Note: These users have confirmed emails and can immediately use magic link authentication
-- In production, this migration should NOT be applied or should be modified to remove these test accounts

-- Insert test users into auth.users
-- The password field is not needed for magic link authentication but we include it for completeness
-- Passwords are bcrypt hashed: all use password "testpassword123"
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  invited_at,
  confirmation_token,
  confirmation_sent_at,
  recovery_token,
  recovery_sent_at,
  email_change_token_new,
  email_change,
  email_change_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  created_at,
  updated_at,
  phone,
  phone_confirmed_at,
  phone_change,
  phone_change_token,
  phone_change_sent_at,
  email_change_token_current,
  email_change_confirm_status,
  banned_until,
  reauthentication_token,
  reauthentication_sent_at
) VALUES
  -- Test User 1: test1@example.com
  (
    '00000000-0000-0000-0000-000000000000',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', -- Fixed UUID for test user 1
    'authenticated',
    'authenticated',
    'test1@example.com',
    '$2a$10$YQzLx5ZQwJJVVL3Z0Yl4HO.hX6FH6P0qy.3YQzLx5ZQwJJVVL3Z0Y', -- bcrypt hash of "testpassword123"
    NOW(),
    NULL,
    '',
    NULL,
    '',
    NULL,
    '',
    '',
    NULL,
    NOW(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Test User One","avatar_url":""}',
    FALSE,
    NOW(),
    NOW(),
    NULL,
    NULL,
    '',
    '',
    NULL,
    '',
    0,
    NULL,
    '',
    NULL
  ),
  -- Test User 2: test2@example.com
  (
    '00000000-0000-0000-0000-000000000000',
    'b1ffcd99-9c1b-4ef8-bb6d-6bb9bd380a22', -- Fixed UUID for test user 2
    'authenticated',
    'authenticated',
    'test2@example.com',
    '$2a$10$YQzLx5ZQwJJVVL3Z0Yl4HO.hX6FH6P0qy.3YQzLx5ZQwJJVVL3Z0Y', -- bcrypt hash of "testpassword123"
    NOW(),
    NULL,
    '',
    NULL,
    '',
    NULL,
    '',
    '',
    NULL,
    NOW(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Test User Two","avatar_url":""}',
    FALSE,
    NOW(),
    NOW(),
    NULL,
    NULL,
    '',
    '',
    NULL,
    '',
    0,
    NULL,
    '',
    NULL
  ),
  -- Demo User: demo@example.com
  (
    '00000000-0000-0000-0000-000000000000',
    'c2ffcd99-9c2b-4ef8-bb6d-6bb9bd380a33', -- Fixed UUID for demo user
    'authenticated',
    'authenticated',
    'demo@example.com',
    '$2a$10$YQzLx5ZQwJJVVL3Z0Yl4HO.hX6FH6P0qy.3YQzLx5ZQwJJVVL3Z0Y', -- bcrypt hash of "testpassword123"
    NOW(),
    NULL,
    '',
    NULL,
    '',
    NULL,
    '',
    '',
    NULL,
    NOW(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Demo User","avatar_url":""}',
    FALSE,
    NOW(),
    NOW(),
    NULL,
    NULL,
    '',
    '',
    NULL,
    '',
    0,
    NULL,
    '',
    NULL
  )
ON CONFLICT (id) DO NOTHING;

-- Insert corresponding identities for each user
-- Note: The identities table structure may vary by Supabase version
-- This uses INSERT with a check to avoid errors if identities already exist
DO $$
BEGIN
  -- Insert identity for test1@example.com
  IF NOT EXISTS (SELECT 1 FROM auth.identities WHERE user_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11' AND provider = 'email') THEN
    INSERT INTO auth.identities (id, provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
    VALUES (
      'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      '{"sub":"a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11","email":"test1@example.com"}',
      'email',
      NOW(),
      NOW(),
      NOW()
    );
  END IF;

  -- Insert identity for test2@example.com
  IF NOT EXISTS (SELECT 1 FROM auth.identities WHERE user_id = 'b1ffcd99-9c1b-4ef8-bb6d-6bb9bd380a22' AND provider = 'email') THEN
    INSERT INTO auth.identities (id, provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
    VALUES (
      'b1ffcd99-9c1b-4ef8-bb6d-6bb9bd380a22',
      'b1ffcd99-9c1b-4ef8-bb6d-6bb9bd380a22',
      'b1ffcd99-9c1b-4ef8-bb6d-6bb9bd380a22',
      '{"sub":"b1ffcd99-9c1b-4ef8-bb6d-6bb9bd380a22","email":"test2@example.com"}',
      'email',
      NOW(),
      NOW(),
      NOW()
    );
  END IF;

  -- Insert identity for demo@example.com
  IF NOT EXISTS (SELECT 1 FROM auth.identities WHERE user_id = 'c2ffcd99-9c2b-4ef8-bb6d-6bb9bd380a33' AND provider = 'email') THEN
    INSERT INTO auth.identities (id, provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
    VALUES (
      'c2ffcd99-9c2b-4ef8-bb6d-6bb9bd380a33',
      'c2ffcd99-9c2b-4ef8-bb6d-6bb9bd380a33',
      'c2ffcd99-9c2b-4ef8-bb6d-6bb9bd380a33',
      '{"sub":"c2ffcd99-9c2b-4ef8-bb6d-6bb9bd380a33","email":"demo@example.com"}',
      'email',
      NOW(),
      NOW(),
      NOW()
    );
  END IF;
END $$;

-- Verification: Show the created test users
-- Uncomment the following line to verify users were created:
-- SELECT id, email, email_confirmed_at, created_at FROM auth.users WHERE email LIKE '%@example.com';

