-- SQL dump of quiz records with empty/invalid options
-- Generated: 2025年 9月15日 星期一 00时55分31秒 CST
-- Database: kedge_db
-- Total problematic records: 1

BEGIN;

-- Backup table for safety
CREATE TABLE IF NOT EXISTS kedge_practice.quizzes_empty_options_backup AS
SELECT * FROM kedge_practice.quizzes
WHERE 
    options IS NULL OR 
    options::text = '[]' OR
    options::text = 'null' OR
    (options IS NOT NULL AND NOT EXISTS (
        SELECT 1 FROM jsonb_array_elements_text(options) AS elem 
        WHERE trim(elem) != ''
    ));

-- Records with problematic options
-- Record: a13abbe2-d0e3-4c1d-a509-09cce6b2c321 (Type: single-choice, Options: ["", "", "", ""])
SELECT * FROM kedge_practice.quizzes WHERE id = 'a13abbe2-d0e3-4c1d-a509-09cce6b2c321';


-- Example fixes:
-- UPDATE kedge_practice.quizzes SET options = '["Option A", "Option B", "Option C", "Option D"]'::jsonb WHERE id = 'some-uuid';
-- DELETE FROM kedge_practice.quizzes WHERE options IS NULL AND type = 'single-choice';

COMMIT;
