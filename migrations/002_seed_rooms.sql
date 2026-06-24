-- Seed: Rooms & default data for Wisma Eucaliptus
-- Run after schema is pushed:
--   psql $DATABASE_URL -f migrations/001_add_users.sql
--   psql $DATABASE_URL -f migrations/002_seed_rooms.sql
--
-- Room types:
--   single  (★)   = Kamar Standard — Single/Double Bed
--   family  (★★)  = Kamar Keluarga — Family Room
--   double  (★★★) = Kamar Long Stay / Big Room
--
-- Long stay designations (informational, actual status set at check-in):
--   Japan longstay ★★★ : 23, 24, 27, 30, 31, 54, 55, 60
--   Local longstay ★★★ : 61, 62
--   Local ★             : 51, 53

-- Clear existing rooms (cascade to related tables)
DELETE FROM rooms;

-- ── BLOCK C ──────────────────────────────────────────────────────
-- Rooms 1–19: Standard (★)
INSERT INTO rooms (number, block, type, stars, room_name, status, is_facility) VALUES
  ('1',  'C', 'single', 1, 'Kamar Standard (★)', 'available', false),
  ('2',  'C', 'single', 1, 'Kamar Standard (★)', 'available', false),
  ('3',  'C', 'single', 1, 'Kamar Standard (★)', 'available', false),
  ('5',  'C', 'single', 1, 'Kamar Standard (★)', 'available', false),
  ('6',  'C', 'single', 1, 'Kamar Standard (★)', 'available', false),
  ('7',  'C', 'single', 1, 'Kamar Standard (★)', 'available', false),
  ('8',  'C', 'single', 1, 'Kamar Standard (★)', 'available', false),
  ('10', 'C', 'single', 1, 'Kamar Standard (★)', 'available', false),
  ('11', 'C', 'single', 1, 'Kamar Standard (★)', 'available', false),
  ('12', 'C', 'single', 1, 'Kamar Standard (★)', 'available', false),
  ('14', 'C', 'single', 1, 'Kamar Standard (★)', 'available', false),
  ('15', 'C', 'single', 1, 'Kamar Standard (★)', 'available', false),
  ('16', 'C', 'single', 1, 'Kamar Standard (★)', 'available', false),
  ('17', 'C', 'single', 1, 'Kamar Standard (★)', 'available', false),
  ('18', 'C', 'single', 1, 'Kamar Standard (★)', 'available', false),
  ('19', 'C', 'single', 1, 'Kamar Standard (★)', 'available', false);

-- ── BLOCK A ──────────────────────────────────────────────────────
-- Rooms 21, 22  : Keluarga (★★)
-- Rooms 23,24,27,30,31 : Long Stay Japan (★★★)
INSERT INTO rooms (number, block, type, stars, room_name, status, is_facility) VALUES
  ('21', 'A', 'family', 2, 'Kamar Keluarga (★★)',     'available', false),
  ('22', 'A', 'family', 2, 'Kamar Keluarga (★★)',     'available', false),
  ('23', 'A', 'double', 3, 'Kamar Long Stay (★★★)',   'available', false),
  ('24', 'A', 'double', 3, 'Kamar Long Stay (★★★)',   'available', false),
  ('27', 'A', 'double', 3, 'Kamar Long Stay (★★★)',   'available', false),
  ('30', 'A', 'double', 3, 'Kamar Long Stay (★★★)',   'available', false),
  ('31', 'A', 'double', 3, 'Kamar Long Stay (★★★)',   'available', false);

-- ── BLOCK E ──────────────────────────────────────────────────────
-- Rooms 34–39, 41–48 : Keluarga (★★)
-- Rooms 40, 49        : Standard (★)
INSERT INTO rooms (number, block, type, stars, room_name, status, is_facility) VALUES
  ('34', 'E', 'family', 2, 'Kamar Keluarga (★★)', 'available', false),
  ('35', 'E', 'family', 2, 'Kamar Keluarga (★★)', 'available', false),
  ('36', 'E', 'family', 2, 'Kamar Keluarga (★★)', 'available', false),
  ('37', 'E', 'family', 2, 'Kamar Keluarga (★★)', 'available', false),
  ('38', 'E', 'family', 2, 'Kamar Keluarga (★★)', 'available', false),
  ('39', 'E', 'family', 2, 'Kamar Keluarga (★★)', 'available', false),
  ('40', 'E', 'single', 1, 'Kamar Standard (★)',  'available', false),
  ('41', 'E', 'family', 2, 'Kamar Keluarga (★★)', 'available', false),
  ('42', 'E', 'family', 2, 'Kamar Keluarga (★★)', 'available', false),
  ('43', 'E', 'family', 2, 'Kamar Keluarga (★★)', 'available', false),
  ('44', 'E', 'family', 2, 'Kamar Keluarga (★★)', 'available', false),
  ('45', 'E', 'family', 2, 'Kamar Keluarga (★★)', 'available', false),
  ('46', 'E', 'family', 2, 'Kamar Keluarga (★★)', 'available', false),
  ('47', 'E', 'family', 2, 'Kamar Keluarga (★★)', 'available', false),
  ('48', 'E', 'family', 2, 'Kamar Keluarga (★★)', 'available', false),
  ('49', 'E', 'single', 1, 'Kamar Standard (★)',  'available', false);

-- ── BLOCK G ──────────────────────────────────────────────────────
-- Rooms 50, 52       : Standard (★)
-- Rooms 51, 53       : Standard (★) — local
-- Rooms 54, 55, 60   : Long Stay Japan (★★★)
-- Rooms 61, 62       : Long Stay Local (★★★)
INSERT INTO rooms (number, block, type, stars, room_name, status, is_facility) VALUES
  ('50', 'G', 'single', 1, 'Kamar Standard (★)',    'available', false),
  ('51', 'G', 'single', 1, 'Kamar Standard (★)',    'available', false),
  ('52', 'G', 'single', 1, 'Kamar Standard (★)',    'available', false),
  ('53', 'G', 'single', 1, 'Kamar Standard (★)',    'available', false),
  ('54', 'G', 'double', 3, 'Kamar Long Stay (★★★)', 'available', false),
  ('55', 'G', 'double', 3, 'Kamar Long Stay (★★★)', 'available', false),
  ('60', 'G', 'double', 3, 'Kamar Long Stay (★★★)', 'available', false),
  ('61', 'G', 'double', 3, 'Kamar Long Stay (★★★)', 'available', false),
  ('62', 'G', 'double', 3, 'Kamar Long Stay (★★★)', 'available', false);

-- ── SETTINGS ─────────────────────────────────────────────────────
INSERT INTO settings (key, value) VALUES
  ('pin', '1234')
ON CONFLICT (key) DO NOTHING;
