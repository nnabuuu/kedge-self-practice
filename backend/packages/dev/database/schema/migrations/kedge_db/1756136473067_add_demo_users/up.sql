-- Add demo users for testing and development
-- Password for all demo users is: 11223344

-- Generate salt and hash for password '11223344'
-- Using PBKDF2 with 1000 iterations and SHA512
-- The hash below is generated from password '11223344' with salt 'demosalt123456'

-- Insert demo student user
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
    gen_random_uuid(),
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
    role = EXCLUDED.role,
    is_admin = EXCLUDED.is_admin,
    updated_at = NOW();

-- Insert demo teacher user
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
    gen_random_uuid(),
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
    role = EXCLUDED.role,
    is_admin = EXCLUDED.is_admin,
    updated_at = NOW();

-- Insert demo admin user
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
    gen_random_uuid(),
    'admin@example.com',
    'Demo Admin',
    '88fa184d1b6927c7e22e66cb5e32535868b78197342ea3e6e84fa849a8d47c5b22616b37de9aa98f1a4e66c44b1125f0c44dae94c3c5eae8e73165c437c50490',
    'demosalt123456',
    'admin',
    true,  -- is_admin flag set to true
    '{}',
    NOW(),
    NOW()
) ON CONFLICT (account_id) DO UPDATE SET
    name = EXCLUDED.name,
    role = EXCLUDED.role,
    is_admin = EXCLUDED.is_admin,
    updated_at = NOW();