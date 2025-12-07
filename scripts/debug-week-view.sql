-- Script de diagnostic pour comprendre pourquoi weekData contient 9 éléments

-- Test 1: Afficher TOUTES les lignes retournées par v_dashboard_week
SELECT
  'Résultat v_dashboard_week' as info,
  boucherie_id,
  date,
  jour_court,
  date_format,
  total
FROM v_dashboard_week
ORDER BY date;

-- Test 2: Compter le nombre de lignes par date
SELECT
  'Nombre de lignes par date dans v_dashboard_week' as info,
  date,
  COUNT(*) as nb_lignes,
  SUM(total) as total_jour
FROM v_dashboard_week
GROUP BY date
ORDER BY date;

-- Test 3: Vérifier les limites de date calculées
SELECT
  'Calcul des limites de date pour dimanche 07/12' as info,
  CURRENT_DATE as aujourdhui,
  EXTRACT(DOW FROM CURRENT_DATE) as dow_aujourdhui,
  CURRENT_DATE - (CASE WHEN EXTRACT(DOW FROM CURRENT_DATE) = 0 THEN 6 ELSE EXTRACT(DOW FROM CURRENT_DATE) - 1 END) * INTERVAL '1 day' as date_debut_calcule,
  CURRENT_DATE + (CASE WHEN EXTRACT(DOW FROM CURRENT_DATE) = 0 THEN 0 ELSE 7 - EXTRACT(DOW FROM CURRENT_DATE) END) * INTERVAL '1 day' as date_fin_calcule;

-- Test 4: Compter les encaissements bruts dans la période
SELECT
  'Encaissements bruts entre les dates calculées' as info,
  COUNT(*) as nb_total_lignes,
  COUNT(DISTINCT date) as nb_jours_distincts
FROM encaissements
WHERE date >= CURRENT_DATE - (CASE WHEN EXTRACT(DOW FROM CURRENT_DATE) = 0 THEN 6 ELSE EXTRACT(DOW FROM CURRENT_DATE) - 1 END) * INTERVAL '1 day'
  AND date <= CURRENT_DATE + (CASE WHEN EXTRACT(DOW FROM CURRENT_DATE) = 0 THEN 0 ELSE 7 - EXTRACT(DOW FROM CURRENT_DATE) END) * INTERVAL '1 day';

-- Test 5: Lister TOUS les encaissements de la période
SELECT
  'Tous les encaissements de la période' as info,
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
WHERE date >= CURRENT_DATE - (CASE WHEN EXTRACT(DOW FROM CURRENT_DATE) = 0 THEN 6 ELSE EXTRACT(DOW FROM CURRENT_DATE) - 1 END) * INTERVAL '1 day'
  AND date <= CURRENT_DATE + (CASE WHEN EXTRACT(DOW FROM CURRENT_DATE) = 0 THEN 0 ELSE 7 - EXTRACT(DOW FROM CURRENT_DATE) END) * INTERVAL '1 day'
ORDER BY date, created_at;
