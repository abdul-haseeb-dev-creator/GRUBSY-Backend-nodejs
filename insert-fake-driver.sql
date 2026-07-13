-- Insert fake driver data for testing
-- Driver ID: GD-001
-- Email: driver@grubsy.com
-- Password: 123456 (hashed with bcrypt)

INSERT INTO Drivers (
  Driver_ID,
  first_name,
  last_name,
  email,
  phone,
  driver_pw,
  status,
  vehicle_type,
  Registered_address,
  address_line1,
  city,
  postcode,
  country,
  availability,
  date_joined,
  created_at,
  updated_at
) VALUES (
  'GD-001',
  'Test',
  'Driver',
  'driver@grubsy.com',
  '+447700900123',
  '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPjYQmHqU1Yq6', -- bcrypt hash for '123456'
  'active',
  'car',
  '123 Test Street, London',
  '123 Test Street',
  'London',
  'SW1A 1AA',
  'GB',
  'available',
  NOW(),
  NOW(),
  NOW()
);