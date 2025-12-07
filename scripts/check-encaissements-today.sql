-- Vérifier les encaissements créés le 07/12/2025
SELECT
  id,
  date,
  espece,
  cb,
  ch_vr,
  tr,
  total,
  boucherie_id,
  created_at,
  updated_at
FROM encaissements
WHERE created_at::date = '2025-12-07'
ORDER BY created_at DESC;
