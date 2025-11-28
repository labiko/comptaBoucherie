-- Migration : Supprimer la contrainte UNIQUE(date, user_id) et la remplacer par UNIQUE(date)
-- Tous les utilisateurs partagent les mêmes données - un seul encaissement par jour

-- 1. Supprimer l'ancienne contrainte UNIQUE(date, user_id)
ALTER TABLE encaissements
DROP CONSTRAINT IF EXISTS encaissements_date_user_id_key;

-- 2. Supprimer les doublons potentiels (garder le plus récent pour chaque date)
DELETE FROM encaissements a
USING encaissements b
WHERE a.date = b.date
  AND a.created_at < b.created_at;

-- 3. Ajouter la nouvelle contrainte UNIQUE(date)
ALTER TABLE encaissements
ADD CONSTRAINT encaissements_date_key UNIQUE (date);

-- 4. Faire la même chose pour les factures si nécessaire
ALTER TABLE factures
DROP CONSTRAINT IF EXISTS factures_date_user_id_key;

-- Vérification
SELECT
  'Migration terminée : un seul encaissement par date, partagé par tous les utilisateurs' as message;

-- Afficher les encaissements restants
SELECT
  date,
  espece,
  cb,
  ch_vr,
  tr,
  total,
  user_id,
  updated_by,
  created_at
FROM encaissements
ORDER BY date DESC
LIMIT 10;
