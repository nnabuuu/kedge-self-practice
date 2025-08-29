-- Remove demo users
DELETE FROM kedge_practice.users 
WHERE account_id IN ('student@example.com', 'teacher@example.com', 'admin@example.com');