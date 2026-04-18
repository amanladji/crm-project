-- Clear all data from CRM database
-- This script drops all tables and truncates sequences

-- Disable foreign key constraints
ALTER TABLE chat_messages DROP CONSTRAINT IF EXISTS fk_chat_receiver;
ALTER TABLE chat_messages DROP CONSTRAINT IF EXISTS fk_chat_sender;
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS fk_notification_user;
ALTER TABLE campaign_users DROP CONSTRAINT IF EXISTS fk_campaign_users_campaign;
ALTER TABLE campaign_users DROP CONSTRAINT IF EXISTS fk_campaign_users_user;
ALTER TABLE activities DROP CONSTRAINT IF EXISTS fk_activities_lead;
ALTER TABLE activities DROP CONSTRAINT IF EXISTS fk_activities_customer;
ALTER TABLE activities DROP CONSTRAINT IF EXISTS fk_activities_user;
ALTER TABLE conversations DROP CONSTRAINT IF EXISTS fk_conversation_user1;
ALTER TABLE conversations DROP CONSTRAINT IF EXISTS fk_conversation_user2;
ALTER TABLE leads DROP CONSTRAINT IF EXISTS fk_leads_customer;
ALTER TABLE leads DROP CONSTRAINT IF EXISTS fk_leads_user;
ALTER TABLE campaigns DROP CONSTRAINT IF EXISTS fk_campaigns_user;

-- Drop all tables
DROP TABLE IF EXISTS chat_messages CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS campaign_users CASCADE;
DROP TABLE IF EXISTS campaigns CASCADE;
DROP TABLE IF EXISTS activities CASCADE;
DROP TABLE IF EXISTS conversations CASCADE;
DROP TABLE IF EXISTS leads CASCADE;
DROP TABLE IF EXISTS customers CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS hibernate_sequence CASCADE;

-- Verify tables are gone
SELECT tablename FROM pg_tables WHERE schemaname = 'public';
