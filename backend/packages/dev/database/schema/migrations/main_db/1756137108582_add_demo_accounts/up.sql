-- Add demo accounts for testing and development
-- Password for all demo accounts is: 11223344
-- Using PBKDF2 with 1000 iterations and SHA512 (matches auth.service.ts)

-- First ensure is_admin column exists
ALTER TABLE kedge_practice.users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;
CREATE INDEX IF NOT EXISTS idx_users_is_admin ON kedge_practice.users(is_admin) WHERE is_admin = TRUE;

-- Insert or update demo student account
INSERT INTO kedge_practice.users (
    id,
    account_id,
    name,
    password_hash,
    salt,
    role,
    is_admin,
    preferences,
    created_at,
    updated_at
) VALUES (
    'a1111111-1111-1111-1111-111111111111'::uuid,
    'student@example.com',
    'Demo Student',
    '88fa184d1b6927c7e22e66cb5e32535868b78197342ea3e6e84fa849a8d47c5b22616b37de9aa98f1a4e66c44b1125f0c44dae94c3c5eae8e73165c437c50490',
    'demosalt123456',
    'student',
    false,
    '{}',
    NOW(),
    NOW()
) ON CONFLICT (account_id) DO UPDATE SET
    name = EXCLUDED.name,
    password_hash = EXCLUDED.password_hash,
    salt = EXCLUDED.salt,
    role = EXCLUDED.role,
    is_admin = EXCLUDED.is_admin,
    updated_at = NOW();

-- Insert or update demo teacher account
INSERT INTO kedge_practice.users (
    id,
    account_id,
    name,
    password_hash,
    salt,
    role,
    is_admin,
    preferences,
    created_at,
    updated_at
) VALUES (
    'b2222222-2222-2222-2222-222222222222'::uuid,
    'teacher@example.com',
    'Demo Teacher',
    '88fa184d1b6927c7e22e66cb5e32535868b78197342ea3e6e84fa849a8d47c5b22616b37de9aa98f1a4e66c44b1125f0c44dae94c3c5eae8e73165c437c50490',
    'demosalt123456',
    'teacher',
    false,
    '{}',
    NOW(),
    NOW()
) ON CONFLICT (account_id) DO UPDATE SET
    name = EXCLUDED.name,
    password_hash = EXCLUDED.password_hash,
    salt = EXCLUDED.salt,
    role = EXCLUDED.role,
    is_admin = EXCLUDED.is_admin,
    updated_at = NOW();

-- Insert or update demo admin account
INSERT INTO kedge_practice.users (
    id,
    account_id,
    name,
    password_hash,
    salt,
    role,
    is_admin,
    preferences,
    created_at,
    updated_at
) VALUES (
    'c3333333-3333-3333-3333-333333333333'::uuid,
    'admin@example.com',
    'Demo Admin',
    '88fa184d1b6927c7e22e66cb5e32535868b78197342ea3e6e84fa849a8d47c5b22616b37de9aa98f1a4e66c44b1125f0c44dae94c3c5eae8e73165c437c50490',
    'demosalt123456',
    'admin',
    true,  -- Admin has is_admin flag set to true
    '{}',
    NOW(),
    NOW()
) ON CONFLICT (account_id) DO UPDATE SET
    name = EXCLUDED.name,
    password_hash = EXCLUDED.password_hash,
    salt = EXCLUDED.salt,
    role = EXCLUDED.role,
    is_admin = EXCLUDED.is_admin,
    updated_at = NOW();