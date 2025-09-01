-- =================================================================
-- REVERT VOLUME NAMES MIGRATION
-- =================================================================
-- This reverts the volume name changes (not recommended)
-- =================================================================

-- Note: This down migration is provided for completeness but reverting
-- standardized names is not recommended as it would break consistency

-- Revert specific knowledge points back to '纲要上册'
UPDATE kedge_practice.knowledge_points 
SET volume = '纲要上册', updated_at = NOW()
WHERE id IN ('kp_260', 'kp_261', 'kp_262', 'kp_263', 'kp_264', 'kp_265', 'kp_266', 
             'kp_267', 'kp_268', 'kp_269', 'kp_270', 'kp_271', 'kp_272', 'kp_274', 'kp_275');

-- Revert specific knowledge points back to '纲要下册'
UPDATE kedge_practice.knowledge_points 
SET volume = '纲要下册', updated_at = NOW()
WHERE id IN ('kp_277', 'kp_278', 'kp_279', 'kp_280', 'kp_281', 'kp_283', 'kp_284', 
             'kp_285', 'kp_286', 'kp_287', 'kp_288', 'kp_289', 'kp_290', 'kp_291', 
             'kp_292', 'kp_293', 'kp_294', 'kp_295', 'kp_296', 'kp_297', 'kp_298', 
             'kp_299', 'kp_300', 'kp_301', 'kp_302', 'kp_303', 'kp_304');