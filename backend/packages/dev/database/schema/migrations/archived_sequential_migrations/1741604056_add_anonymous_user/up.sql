-- Insert anonymous user for unauthenticated practice sessions
INSERT INTO kedge_practice.users (
    id,
    name,
    account_id,
    password_hash,
    salt,
    role,
    preferences,
    created_at,
    updated_at
) VALUES (
    '00000000-0000-0000-0000-000000000000'::UUID,
    'anonymous',
    'anonymous_user', -- unique account_id for anonymous user
    'not_used', -- This user cannot login
    'not_used', -- This user cannot login
    'student',
    '{"lastAccessedSubject": null, "uiSettings": {"theme": "light", "language": "zh-CN"}}'::jsonb,
    NOW(),
    NOW()
) ON CONFLICT (id) DO NOTHING;