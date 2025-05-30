-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Set timezone
SET timezone = 'Asia/Tokyo';

-- Create enum types
CREATE TYPE user_role AS ENUM ('client', 'tax_accountant', 'admin');
CREATE TYPE consultation_status AS ENUM ('pending', 'accepted', 'rejected', 'completed', 'cancelled');
CREATE TYPE message_status AS ENUM ('sent', 'delivered', 'read');

-- Grant permissions to the application user
GRANT ALL PRIVILEGES ON DATABASE tax_matching_db TO tax_matching_user;
GRANT ALL ON SCHEMA public TO tax_matching_user;