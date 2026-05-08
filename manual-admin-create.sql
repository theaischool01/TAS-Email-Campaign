-- Manual Admin User Creation SQL
-- Run this directly in your Neon PostgreSQL database

-- First, let's check if the user already exists
SELECT * FROM users WHERE email = 'admin@example.com';

-- If no user exists, insert the admin user
-- Password: admin123 (hashed with bcrypt, 12 salt rounds)
INSERT INTO users (
  id,
  name,
  email,
  password,
  role,
  "createdAt",
  "updatedAt"
) VALUES (
  'admin_' || substr(gen_random_uuid(), 1, 20),
  'Super Admin',
  'admin@example.com',
  '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6hsxq9w5KS', -- bcrypt hash of 'admin123'
  'SUPER_ADMIN',
  NOW(),
  NOW()
) ON CONFLICT (email) DO UPDATE SET
  password = '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6hsxq9w5KS',
  name = 'Super Admin',
  role = 'SUPER_ADMIN',
  "updatedAt" = NOW();

-- Verify the user was created
SELECT id, name, email, role, "createdAt" FROM users WHERE email = 'admin@example.com';

-- Login credentials:
-- Email: admin@example.com
-- Password: admin123
