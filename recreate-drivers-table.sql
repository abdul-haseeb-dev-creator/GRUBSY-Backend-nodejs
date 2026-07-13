-- Recreate Drivers table with new comprehensive schema
-- WARNING: This will DROP the existing Drivers table and recreate it with new structure
-- All existing data will be lost!

DROP TABLE IF EXISTS Drivers;

CREATE TABLE Drivers (
  Driver_ID VARCHAR(20) NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  profile_photo_url VARCHAR(512) NULL,
  email VARCHAR(255) NULL,
  phone VARCHAR(32) NOT NULL,
  phone_verified_at DATETIME NULL,
  email_verified_at DATETIME NULL,
  status ENUM('pending','active','suspended','deactivated') NOT NULL DEFAULT 'pending',
  date_joined DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_login DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  vehicle_type ENUM('bicycle','scooter','motorbike','car','van') NOT NULL,
  vehicle_reg VARCHAR(64) NULL,
  driving_licence VARCHAR(128) NULL,
  licence_expiry DATE NULL,
  Registered_address VARCHAR(200) NOT NULL,
  address_line1 VARCHAR(200) NOT NULL,
  address_line2 VARCHAR(200) NULL,
  city VARCHAR(100) NOT NULL,
  state_region VARCHAR(100) NULL,
  postcode VARCHAR(32) NOT NULL,
  country CHAR(2) NOT NULL,
  insurance_provider VARCHAR(120) NULL,
  insurance_policy_number VARCHAR(80) NULL,
  insurance_coverage_type VARCHAR(80) NULL,
  insurance_expiry DATE NULL,
  insurance_verified ENUM('unverified','pending','verified','rejected') NOT NULL DEFAULT 'unverified',
  insurance_document_url VARCHAR(512) NULL,
  UTR_Number VARCHAR(10) NULL,
  NI_Number VARCHAR(13) NULL,
  availability ENUM('offline','available','busy','paused') NOT NULL DEFAULT 'offline',
  current_location_lat DECIMAL(9,6) NULL,
  current_location_lng DECIMAL(9,6) NULL,
  location_updated_at DATETIME NULL,
  completed_orders INT NOT NULL DEFAULT 0,
  cancellations_count INT NOT NULL DEFAULT 0,
  emergencies INT NOT NULL DEFAULT 0,
  earnings_total DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  tips_total DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  current_balance DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  last_payout_at DATETIME NULL,
  rating_avg DECIMAL(3,2) NOT NULL DEFAULT 0.00,
  rating_count INT NOT NULL DEFAULT 0,
  emergency_contact_name VARCHAR(100) NULL,
  emergency_contact_phone VARCHAR(32) NULL,
  base_city VARCHAR(100) NULL,
  work_schedule TEXT NULL,
  driver_pw VARCHAR(255) NULL,
  PRIMARY KEY (Driver_ID),
  UNIQUE KEY unique_email (email),
  UNIQUE KEY unique_phone (phone),
  INDEX idx_status (status),
  INDEX idx_availability (availability),
  INDEX idx_vehicle_type (vehicle_type),
  INDEX idx_city (city),
  INDEX idx_postcode (postcode)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Optional: Add some test driver data
/*
INSERT INTO Drivers (
  first_name, last_name, email, phone, status, vehicle_type,
  Registered_address, address_line1, city, postcode, country
) VALUES
('John', 'Smith', 'john.smith@example.com', '+447700900001', 'active', 'car',
 '123 Main Street', '123 Main Street', 'London', 'SW1A 1AA', 'GB'),
('Sarah', 'Johnson', 'sarah.johnson@example.com', '+447700900002', 'active', 'scooter',
 '456 Oak Avenue', '456 Oak Avenue', 'Manchester', 'M1 1AA', 'GB'),
('Mike', 'Wilson', 'mike.wilson@example.com', '+447700900003', 'pending', 'bicycle',
 '789 Pine Road', '789 Pine Road', 'Birmingham', 'B1 1AA', 'GB');
*/