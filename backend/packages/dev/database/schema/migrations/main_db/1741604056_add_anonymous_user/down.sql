-- Remove anonymous user
DELETE FROM kedge_practice.users WHERE id = '00000000-0000-0000-0000-000000000000'::UUID;