-- ============================================================
-- CHARITY MANAGEMENT SYSTEM — CLEAN DATABASE SCHEMA
-- Roles: ADMIN, USER only | No OTP | No Volunteers
-- ============================================================
DROP DATABASE IF EXISTS charity_db;
CREATE DATABASE IF NOT EXISTS charity_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE charity_db;

-- ============================================================
-- TABLE: roles
-- ============================================================
CREATE TABLE IF NOT EXISTS roles (
  role_id   BIGINT PRIMARY KEY AUTO_INCREMENT,
  role_name ENUM('ADMIN','USER') NOT NULL UNIQUE
);

-- ============================================================
-- TABLE: users
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  user_id    BIGINT PRIMARY KEY AUTO_INCREMENT,
  full_name  VARCHAR(150)         NOT NULL,
  email      VARCHAR(255)         NOT NULL UNIQUE,
  password   VARCHAR(255)         NOT NULL,
  phone      VARCHAR(20),
  address    TEXT,
  role_id    BIGINT               NOT NULL,
  enabled    BOOLEAN DEFAULT TRUE,
  locked     BOOLEAN DEFAULT FALSE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_users_role FOREIGN KEY (role_id) REFERENCES roles(role_id)
);
  
  show tables;
CREATE INDEX idx_users_email ON users(email);

-- ============================================================
-- TABLE: campaigns (ADMIN ONLY for CRUD)
-- ============================================================
CREATE TABLE IF NOT EXISTS campaigns (
  campaign_id       BIGINT PRIMARY KEY AUTO_INCREMENT,
  campaign_name     VARCHAR(255)   NOT NULL,
  description       TEXT           NOT NULL,
  goal_amount       DECIMAL(15,2)  NOT NULL,
  collected_amount  DECIMAL(15,2)  DEFAULT 0.00,
  start_date        DATE           NOT NULL,
  end_date          DATE           NOT NULL,
  image_url         VARCHAR(500),
  category          VARCHAR(100),
  beneficiaries     INT DEFAULT 0,
  urgency_level     ENUM('LOW','MEDIUM','HIGH','CRITICAL') DEFAULT 'MEDIUM',
  status            ENUM('DRAFT','ACTIVE','COMPLETED','CLOSED') DEFAULT 'DRAFT',
  created_by        BIGINT,
  created_at        DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at        DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_campaign_creator FOREIGN KEY (created_by) REFERENCES users(user_id)
);

SHOW CREATE TABLE users;

CREATE INDEX idx_campaigns_status ON campaigns(status);
CREATE INDEX idx_campaigns_category ON campaigns(category);

-- ============================================================
-- TABLE: donations
-- ============================================================
CREATE TABLE IF NOT EXISTS donations (
  donation_id     BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id         BIGINT         NOT NULL,
  campaign_id     BIGINT         NOT NULL,
  amount          DECIMAL(15,2)  NOT NULL,
  payment_method  ENUM('UPI','CREDIT_CARD','DEBIT_CARD','NET_BANKING') NOT NULL,
  transaction_id  VARCHAR(255),
  donation_date   DATETIME DEFAULT CURRENT_TIMESTAMP,
  status          ENUM('PENDING','SUCCESS','FAILED','REFUNDED') DEFAULT 'PENDING',
  anonymous       BOOLEAN DEFAULT FALSE,
  CONSTRAINT fk_donation_user     FOREIGN KEY (user_id)     REFERENCES users(user_id),
  CONSTRAINT fk_donation_campaign FOREIGN KEY (campaign_id) REFERENCES campaigns(campaign_id)
);

CREATE INDEX idx_donations_user
ON donations(user_id);

CREATE INDEX idx_donations_campaign
ON donations(campaign_id);

-- ============================================================
-- TABLE: transactions (Razorpay)
-- ============================================================
CREATE TABLE IF NOT EXISTS transactions (
  transaction_id      BIGINT PRIMARY KEY AUTO_INCREMENT,
  donation_id         BIGINT        NOT NULL,
  razorpay_order_id   VARCHAR(255)  NOT NULL,
  razorpay_payment_id VARCHAR(255),
  razorpay_signature  VARCHAR(512),
  amount              DECIMAL(15,2) NOT NULL,
  currency            VARCHAR(10) DEFAULT 'INR',
  status              ENUM('CREATED','CAPTURED','FAILED','REFUNDED') DEFAULT 'CREATED',
  created_at          DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_txn_donation FOREIGN KEY (donation_id) REFERENCES donations(donation_id)
);

-- ============================================================
-- TABLE: receipts
-- ============================================================
CREATE TABLE IF NOT EXISTS receipts (
  receipt_id      BIGINT PRIMARY KEY AUTO_INCREMENT,
  donation_id     BIGINT       NOT NULL UNIQUE,
  receipt_number  VARCHAR(50)  NOT NULL UNIQUE,
  issued_at       DATETIME DEFAULT CURRENT_TIMESTAMP,
  pdf_url         VARCHAR(500),
  CONSTRAINT fk_receipt_donation FOREIGN KEY (donation_id) REFERENCES donations(donation_id)
);

-- ============================================================
-- TABLE: fund_allocations (ADMIN ONLY)
-- ============================================================
CREATE TABLE IF NOT EXISTS fund_allocations (
  allocation_id   BIGINT PRIMARY KEY AUTO_INCREMENT,
  campaign_id     BIGINT        NOT NULL,
  allocated_by    BIGINT        NOT NULL,
  amount          DECIMAL(15,2) NOT NULL,
  purpose         VARCHAR(255)  NOT NULL,
  description     TEXT,
  allocated_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_alloc_campaign FOREIGN KEY (campaign_id) REFERENCES campaigns(campaign_id),
  CONSTRAINT fk_alloc_user     FOREIGN KEY (allocated_by) REFERENCES users(user_id)
);

-- ============================================================
-- TABLE: events (ADMIN ONLY)
-- ============================================================
CREATE TABLE IF NOT EXISTS events (
  event_id     BIGINT PRIMARY KEY AUTO_INCREMENT,
  event_name   VARCHAR(255) NOT NULL,
  location     VARCHAR(255),
  event_date   DATETIME     NOT NULL,
  description  TEXT,
  campaign_id  BIGINT,
  created_by   BIGINT,
  status       ENUM('UPCOMING','ONGOING','COMPLETED','CANCELLED') DEFAULT 'UPCOMING',
  created_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_event_campaign FOREIGN KEY (campaign_id) REFERENCES campaigns(campaign_id),
  CONSTRAINT fk_event_creator  FOREIGN KEY (created_by)  REFERENCES users(user_id)
);

-- ============================================================
-- TABLE: audit_logs (ADMIN ONLY)
-- ============================================================
CREATE TABLE IF NOT EXISTS audit_logs (
  log_id      BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id     BIGINT,
  action      VARCHAR(255) NOT NULL,
  entity_type VARCHAR(100),
  entity_id   BIGINT,
  ip_address  VARCHAR(50),
  details     TEXT,
  timestamp   DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_audit_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE SET NULL
);

CREATE INDEX idx_audit_user
ON audit_logs(user_id);

CREATE INDEX idx_audit_timestamp
ON audit_logs(timestamp);

CREATE DATABASE IF NOT EXISTS charity_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

