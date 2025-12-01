-- Script de mise à jour des credentials SMTP pour la boucherie
-- Date : 2025-01-30
-- Email SMTP : alpha.diallo.mdalpha@gmail.com
-- Password : iqyn ldwm ahtl imsd

-- Mettre à jour les credentials SMTP pour toutes les boucheries actives
UPDATE boucheries
SET
  smtp_email = 'alpha.diallo.mdalpha@gmail.com',
  smtp_password = 'iqyn ldwm ahtl imsd'
WHERE actif = true;

-- Vérifier la mise à jour
SELECT
  id,
  nom,
  email_comptable,
  smtp_email,
  CASE
    WHEN smtp_password IS NOT NULL THEN '✓ Configuré'
    ELSE '✗ Non configuré'
  END as smtp_password_status
FROM boucheries
WHERE actif = true;
