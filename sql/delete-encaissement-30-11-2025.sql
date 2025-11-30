-- Suppression des encaissements du 30/11/2025
-- Date : 2025-01-30

-- Afficher d'abord les enregistrements qui seront supprimés
SELECT
  id,
  boucherie_id,
  date,
  espece,
  cb,
  ch_vr,
  tr,
  total,
  created_at
FROM encaissements
WHERE date = '2025-11-30';

-- Supprimer les encaissements du 30/11/2025
DELETE FROM encaissements
WHERE date = '2025-11-30';

-- Vérifier que la suppression a fonctionné
SELECT COUNT(*) as nombre_restant
FROM encaissements
WHERE date = '2025-11-30';
