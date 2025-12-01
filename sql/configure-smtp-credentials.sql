-- Configuration des credentials SMTP pour l'envoi d'emails
-- Date : 2025-01-30
-- IMPORTANT: Remplacez 'VOTRE_EMAIL@gmail.com' et 'VOTRE_MOT_DE_PASSE_APP' par vos vraies valeurs

-- Étape 1: Ajouter les colonnes si elles n'existent pas encore
ALTER TABLE boucheries
ADD COLUMN IF NOT EXISTS smtp_email TEXT;

ALTER TABLE boucheries
ADD COLUMN IF NOT EXISTS smtp_password TEXT;

-- Étape 2: Mettre à jour toutes les boucheries actives avec les credentials SMTP
UPDATE boucheries
SET
  smtp_email = 'alpha.diallo.mdalpha@gmail.com',
  smtp_password = 'iqyn ldwm ahtl imsd'
WHERE actif = true;

-- Étape 3: Vérifier la configuration
SELECT
  id,
  nom,
  email_comptable,
  smtp_email,
  CASE
    WHEN smtp_password IS NOT NULL THEN '✓ Configuré (masqué)'
    ELSE '✗ Non configuré'
  END as smtp_password_status,
  envoi_auto_factures
FROM boucheries
WHERE actif = true;

-- Message de confirmation
SELECT '✅ Configuration SMTP terminée - Vérifiez les résultats ci-dessus' as message;
