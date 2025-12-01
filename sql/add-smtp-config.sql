-- Migration pour ajouter les champs de configuration SMTP
-- Date : 2025-01-30
-- Permet aux boucheries de configurer leur propre compte Gmail pour l'envoi

-- Ajouter les colonnes SMTP à la table boucheries
ALTER TABLE boucheries
ADD COLUMN IF NOT EXISTS smtp_email TEXT;

ALTER TABLE boucheries
ADD COLUMN IF NOT EXISTS smtp_password TEXT;

-- Commentaires pour les nouvelles colonnes
COMMENT ON COLUMN boucheries.smtp_email IS 'Email Gmail de la boucherie pour l''envoi SMTP';
COMMENT ON COLUMN boucheries.smtp_password IS 'Mot de passe d''application Gmail (stocké en clair pour simplification)';

-- Vérification
SELECT
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'boucheries'
  AND column_name IN ('smtp_email', 'smtp_password', 'email_comptable')
ORDER BY ordinal_position;

SELECT '✅ Migration terminée : Champs SMTP ajoutés à la table boucheries' as message;
