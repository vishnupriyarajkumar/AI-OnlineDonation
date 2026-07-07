-- ============================================================
-- SEED DATA — ADMIN + USER ROLES ONLY
-- ============================================================

USE charity_db;

-- Roles
INSERT IGNORE INTO roles (role_name) VALUES ('ADMIN'), ('USER');

-- Admin user (password: Admin@1234)
INSERT IGNORE INTO users (full_name, email, password, phone, role_id, enabled, locked)
VALUES ('System Admin', 'admin@charityorg.com',
  '$2a$12$9v3tNBrP5n/QLMEX0VX1EOwRJd7bEcDL1tnWH6SMG1iYalEp6Mbe',
  '+919876543210',
  (SELECT role_id FROM roles WHERE role_name = 'ADMIN'),
  TRUE, FALSE);

-- Sample donor users (password: User@1234)
INSERT IGNORE INTO users (full_name, email, password, phone, role_id, enabled, locked)
VALUES
  ('Riya Sharma',   'riya@example.com',   '$2a$12$IHBpM1mRdA/PBJ9LNPNQ5e7VMkL7q.qAI.ZvYQkrLHrZUzR.7fTui', '+919876500001', (SELECT role_id FROM roles WHERE role_name = 'USER'), TRUE, FALSE),
  ('Arjun Mehta',   'arjun@example.com',  '$2a$12$IHBpM1mRdA/PBJ9LNPNQ5e7VMkL7q.qAI.ZvYQkrLHrZUzR.7fTui', '+919876500002', (SELECT role_id FROM roles WHERE role_name = 'USER'), TRUE, FALSE),
  ('Priya Patel',   'priya@example.com',  '$2a$12$IHBpM1mRdA/PBJ9LNPNQ5e7VMkL7q.qAI.ZvYQkrLHrZUzR.7fTui', '+919876500003', (SELECT role_id FROM roles WHERE role_name = 'USER'), TRUE, FALSE);

-- Sample campaigns
INSERT IGNORE INTO campaigns
  (campaign_name, description, goal_amount, collected_amount, start_date, end_date, image_url, category, beneficiaries, urgency_level, status, created_by)
VALUES
  ('Clean Water for Rural Villages',
   'Providing safe drinking water to 500 families in remote Maharashtra villages through deep tube wells and solar pumps.',
   500000.00, 450000.00,
   CURDATE(), DATE_ADD(CURDATE(), INTERVAL 30 DAY),
   'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=600',
   'Water', 500, 'CRITICAL', 'ACTIVE',
   (SELECT user_id FROM users WHERE email='admin@charityorg.com')),

  ('Education for Every Child',
   'Sponsoring school kits, uniforms, and tuition fees for 200 underprivileged children to ensure zero dropout rates.',
   300000.00, 120000.00,
   CURDATE(), DATE_ADD(CURDATE(), INTERVAL 60 DAY),
   'https://images.unsplash.com/photo-1497486751825-1233686d5d80?w=600',
   'Education', 200, 'HIGH', 'ACTIVE',
   (SELECT user_id FROM users WHERE email='admin@charityorg.com')),

  ('Free Medical Camp for Elderly',
   'Free checkups, medicines, cataract surgeries, and diabetes management for 300 senior citizens in rural areas.',
   100000.00, 85000.00,
   CURDATE(), DATE_ADD(CURDATE(), INTERVAL 14 DAY),
   'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=600',
   'Healthcare', 300, 'MEDIUM', 'ACTIVE',
   (SELECT user_id FROM users WHERE email='admin@charityorg.com')),

  ('Flood Relief — Emergency Aid',
   'Emergency food packets, shelter kits, and medical supplies for 2500 flood-affected families in Assam.',
   1000000.00, 750000.00,
   CURDATE(), DATE_ADD(CURDATE(), INTERVAL 10 DAY),
   'https://images.unsplash.com/photo-1504701954957-2010ec3bcec1?w=600',
   'Food', 2500, 'CRITICAL', 'ACTIVE',
   (SELECT user_id FROM users WHERE email='admin@charityorg.com')),

  ('Plant a Million Trees',
   'Community-driven reforestation initiative across 5 districts of Karnataka to combat deforestation.',
   200000.00, 60000.00,
   CURDATE(), DATE_ADD(CURDATE(), INTERVAL 90 DAY),
   'https://images.unsplash.com/photo-1448375240586-882707db888b?w=600',
   'Environment', 10000, 'LOW', 'ACTIVE',
   (SELECT user_id FROM users WHERE email='admin@charityorg.com'));

-- Sample events
INSERT IGNORE INTO events (event_name, location, event_date, description, status, created_by)
VALUES
  ('Tree Plantation Drive 2026', 'Cubbon Park, Bangalore', DATE_ADD(NOW(), INTERVAL 7 DAY),  'Join 500 volunteers to plant 5000 saplings.', 'UPCOMING', (SELECT user_id FROM users WHERE email='admin@charityorg.com')),
  ('Annual Charity Gala',        'Taj Hotel, Mumbai',      DATE_ADD(NOW(), INTERVAL 30 DAY), 'Fundraising gala with dinner and live performances.', 'UPCOMING', (SELECT user_id FROM users WHERE email='admin@charityorg.com')),
  ('Free Health Camp',           'Village Panchayat, Pune', DATE_ADD(NOW(), INTERVAL 3 DAY), 'Free checkups for 500 villagers.', 'UPCOMING', (SELECT user_id FROM users WHERE email='admin@charityorg.com'));
  
  CREATE DATABASE IF NOT EXISTS charity_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

