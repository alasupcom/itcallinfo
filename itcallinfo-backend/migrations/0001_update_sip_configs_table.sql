-- Migration to update sip_configs table to be a relationship table
-- This migration will:
-- 1. Create a backup of existing data
-- 2. Drop the existing table
-- 3. Create the new relationship table structure

-- Step 1: Create backup table with existing data
CREATE TABLE sip_configs_backup AS SELECT * FROM sip_configs;

-- Step 2: Drop the existing table
DROP TABLE sip_configs;

-- Step 3: Create the new relationship table
CREATE TABLE sip_configs (
  id INT(11) NOT NULL AUTO_INCREMENT,
  user_id INT(11) NOT NULL,
  sip_config_id INT(11) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_sip_config (user_id, sip_config_id)
);

-- Step 4: Add indexes for better performance
CREATE INDEX idx_sip_configs_user_id ON sip_configs(user_id);
CREATE INDEX idx_sip_configs_sip_config_id ON sip_configs(sip_config_id); 