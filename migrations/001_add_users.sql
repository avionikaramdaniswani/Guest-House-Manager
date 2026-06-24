-- Migration: Add users table with RBAC roles
-- Run this on your local PostgreSQL database:
--   psql $DATABASE_URL -f migrations/001_add_users.sql

-- Create role enum
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('viewer', 'operator', 'admin');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id            SERIAL PRIMARY KEY,
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  name          TEXT NOT NULL,
  role          user_role NOT NULL DEFAULT 'operator',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed default users
-- Passwords (bcrypt cost 10):
--   admin@wisma.id     → admin123
--   operator@wisma.id  → operator123
--   viewer@wisma.id    → viewer123
INSERT INTO users (email, password_hash, name, role) VALUES
  (
    'admin@wisma.id',
    '$2b$10$pfNfNrEu8ePexnU7CgBqeuV5jpPjpwxJB8ONwX3vkVta1j8YMeaH.',
    'Administrator',
    'admin'
  ),
  (
    'operator@wisma.id',
    '$2b$10$ppM6IZ5M9KKlDhy0eA6WB.PLNlZ96FXP0LReRjHQZPT/J2IK09g/i',
    'Operator',
    'operator'
  ),
  (
    'viewer@wisma.id',
    '$2b$10$TfY4Dxr216/OL07eiMAeNOABdemQsj6pSvcYXlpcALWyihY3Chcqi',
    'Viewer',
    'viewer'
  )
ON CONFLICT (email) DO NOTHING;
