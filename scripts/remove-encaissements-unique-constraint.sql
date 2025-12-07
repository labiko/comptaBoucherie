-- Script pour supprimer la contrainte d'unicité sur (boucherie_id, date)
-- afin de permettre plusieurs encaissements pour la même date
-- Date: 2025-12-07

-- Début de la transaction
BEGIN;

-- Supprimer la contrainte unique existante
ALTER TABLE encaissements
DROP CONSTRAINT IF EXISTS encaissements_boucherie_date_key;

-- Vérifier que la contrainte a bien été supprimée
SELECT
  conname AS constraint_name,
  contype AS constraint_type
FROM pg_constraint
WHERE conrelid = 'encaissements'::regclass
  AND conname LIKE '%date%';

-- Fin de la transaction - Commit si tout s'est bien passé
COMMIT;
