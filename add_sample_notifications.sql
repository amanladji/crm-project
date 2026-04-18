-- Sample notifications for testing
-- Insert sample notifications for various users

INSERT INTO notifications (username, message, is_read, created_at) VALUES
('admin', 'Campaign "Summer Sale 2024" sent successfully to 250 customers', false, NOW() - INTERVAL '5 minutes'),
('admin', 'New lead "Acme Corporation" added to the system', false, NOW() - INTERVAL '15 minutes'),
('admin', 'Customer "Global Industries" updated profile information', false, NOW() - INTERVAL '30 minutes'),
('admin', 'Chat message from John Smith received', true, NOW() - INTERVAL '1 hour'),
('admin', 'Activity reminder: Follow up call with TechCorp Industries scheduled for today', false, NOW() - INTERVAL '2 hours'),
('admin', 'New user registration: michael.johnson@company.com', true, NOW() - INTERVAL '4 hours'),
('admin', 'Report: Monthly sales summary is ready for download', false, NOW() - INTERVAL '6 hours');
