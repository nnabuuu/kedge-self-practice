-- Seed data: Create default admin user
-- Password: admin123456 (you should change this in production)

-- Check if admin user already exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM kedge_practice.users 
    WHERE account_id = 'admin@kedge.com' 
    OR role = 'admin'
  ) THEN
    -- Insert default admin user
    -- Password hash is for 'admin123456' with PBKDF2
    INSERT INTO kedge_practice.users (
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
      'admin@kedge.com',
      '系统管理员',
      -- This is a placeholder hash - in production, generate proper PBKDF2 hash
      'pbkdf2$10000$' || encode(sha256('admin123456' || 'defaultsalt'::bytea), 'hex'),
      'defaultsalt',
      'admin',
      TRUE,
      '{"theme": "light", "notifications": true}'::jsonb,
      NOW(),
      NOW()
    );
    
    RAISE NOTICE 'Default admin user created: admin@kedge.com / admin123456';
  ELSE
    -- Update existing admin users to ensure is_admin flag is set
    UPDATE kedge_practice.users 
    SET is_admin = TRUE 
    WHERE role = 'admin' AND is_admin IS NOT TRUE;
    
    RAISE NOTICE 'Admin users updated with is_admin flag';
  END IF;
END $$;