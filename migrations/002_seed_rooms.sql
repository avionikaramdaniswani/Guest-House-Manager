-- Seed: Rooms & default data for Wisma Eucaliptus
-- Run after schema is pushed:
--   psql $DATABASE_URL -f migrations/001_add_users.sql
--   psql $DATABASE_URL -f migrations/002_seed_rooms.sql
--
-- Room types:
--   single  (★)   = Kamar Standard — Single/Double Bed
--   family  (★★)  = Kamar Keluarga — Family Room
--   double  (★★★) = Kamar Long Stay / Big Room

-- ── BLOCK A ──────────────────────────────────────────────────────
INSERT INTO rooms (number, block, type, stars, room_name, status, is_facility) VALUES
  ('21', 'A', 'single', 1, 'Kamar Standard (★)',    'available', false),
  ('22', 'A', 'single', 1, 'Kamar Standard (★)',    'available', false),
  ('23', 'A', 'family', 2, 'Kamar Keluarga (★★)',   'available', false),
  ('24', 'A', 'family', 2, 'Kamar Keluarga (★★)',   'available', false),
  ('27', 'A', 'family', 2, 'Kamar Keluarga (★★)',   'available', false),
  ('30', 'A', 'family', 2, 'Kamar Keluarga (★★)',   'available', false),
  ('31', 'A', 'family', 2, 'Kamar Keluarga (★★)',   'available', false),
  ('33', 'A', 'single', 1, 'Kamar Standard (★)',    'available', false)
ON CONFLICT (number) DO NOTHING;

-- ── BLOCK C ──────────────────────────────────────────────────────
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
  ('19', 'C', 'single', 1, 'Kamar Standard (★)', 'available', false)
ON CONFLICT (number) DO NOTHING;

-- ── BLOCK E ──────────────────────────────────────────────────────
-- Rooms 34–41: Long Stay / Big Room (★★★)
-- Rooms 42–49: Standard (★)
INSERT INTO rooms (number, block, type, stars, room_name, status, is_facility) VALUES
  ('34', 'E', 'double', 3, 'Kamar Long Stay (★★★)', 'available', false),
  ('35', 'E', 'double', 3, 'Kamar Long Stay (★★★)', 'available', false),
  ('36', 'E', 'double', 3, 'Kamar Long Stay (★★★)', 'available', false),
  ('37', 'E', 'double', 3, 'Kamar Long Stay (★★★)', 'available', false),
  ('38', 'E', 'double', 3, 'Kamar Long Stay (★★★)', 'available', false),
  ('39', 'E', 'double', 3, 'Kamar Long Stay (★★★)', 'available', false),
  ('40', 'E', 'double', 3, 'Kamar Long Stay (★★★)', 'available', false),
  ('41', 'E', 'double', 3, 'Kamar Long Stay (★★★)', 'available', false),
  ('42', 'E', 'single', 1, 'Kamar Standard (★)',    'available', false),
  ('43', 'E', 'single', 1, 'Kamar Standard (★)',    'available', false),
  ('44', 'E', 'single', 1, 'Kamar Standard (★)',    'available', false),
  ('45', 'E', 'single', 1, 'Kamar Standard (★)',    'available', false),
  ('46', 'E', 'single', 1, 'Kamar Standard (★)',    'available', false),
  ('47', 'E', 'single', 1, 'Kamar Standard (★)',    'available', false),
  ('48', 'E', 'single', 1, 'Kamar Standard (★)',    'available', false),
  ('49', 'E', 'single', 1, 'Kamar Standard (★)',    'available', false)
ON CONFLICT (number) DO NOTHING;

-- ── BLOCK G ──────────────────────────────────────────────────────
INSERT INTO rooms (number, block, type, stars, room_name, status, is_facility) VALUES
  ('50', 'G', 'single', 1, 'Kamar Standard (★)',  'available', false),
  ('51', 'G', 'single', 1, 'Kamar Standard (★)',  'available', false),
  ('52', 'G', 'single', 1, 'Kamar Standard (★)',  'available', false),
  ('53', 'G', 'single', 1, 'Kamar Standard (★)',  'available', false),
  ('54', 'G', 'family', 2, 'Kamar Keluarga (★★)', 'available', false),
  ('55', 'G', 'family', 2, 'Kamar Keluarga (★★)', 'available', false),
  ('60', 'G', 'family', 2, 'Kamar Keluarga (★★)', 'available', false),
  ('61', 'G', 'family', 2, 'Kamar Keluarga (★★)', 'available', false),
  ('62', 'G', 'family', 2, 'Kamar Keluarga (★★)', 'available', false)
ON CONFLICT (number) DO NOTHING;

-- ── SETTINGS ─────────────────────────────────────────────────────
INSERT INTO settings (key, value) VALUES
  ('pin', '1234')
ON CONFLICT (key) DO NOTHING;
