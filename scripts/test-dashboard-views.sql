-- =====================================================
-- Script de test des vues Dashboard
-- =====================================================

-- Début de la transaction
BEGIN;

-- Test 1: Vue v_dashboard_week (semaine actuelle)
SELECT
  'TEST v_dashboard_week' as test_name,
  COUNT(*) as nb_jours,
  MIN(date) as date_debut,
  MAX(date) as date_fin,
  SUM(total) as total_semaine
FROM v_dashboard_week;

-- Détail des jours de la semaine actuelle
SELECT
  'Détail semaine actuelle' as info,
  date,
  jour_court,
  date_format,
  total
FROM v_dashboard_week
ORDER BY date;

-- Test 2: Vue v_dashboard_stats (semaine dernière)
SELECT
  'TEST v_dashboard_stats' as test_name,
  recette_jour,
  recette_j7,
  recette_semaine_derniere,
  total_mois
FROM v_dashboard_stats
LIMIT 1;

-- Test 3: Vérification manuelle semaine actuelle
SELECT
  'Vérification manuelle semaine actuelle' as info,
  COUNT(DISTINCT date) as nb_jours,
  SUM(total) as total_semaine,
  MIN(date) as date_debut,
  MAX(date) as date_fin,
  DATE_TRUNC('week', CURRENT_DATE) as lundi_calcule,
  DATE_TRUNC('week', CURRENT_DATE) + INTERVAL '7 days' as lundi_prochain
FROM encaissements
WHERE date >= DATE_TRUNC('week', CURRENT_DATE)
  AND date < DATE_TRUNC('week', CURRENT_DATE) + INTERVAL '7 days';

-- Test 4: Liste tous les encaissements de la semaine actuelle
SELECT
  'Tous les encaissements semaine actuelle' as info,
  date,
  espece,
  cb,
  ch_vr,
  tr,
  total,
  created_at
FROM encaissements
WHERE date >= DATE_TRUNC('week', CURRENT_DATE)
  AND date < DATE_TRUNC('week', CURRENT_DATE) + INTERVAL '7 days'
ORDER BY date, created_at;

-- Test 5: Vérification semaine dernière
SELECT
  'Vérification manuelle semaine dernière' as info,
  COUNT(DISTINCT date) as nb_jours,
  SUM(total) as total_semaine,
  MIN(date) as date_debut,
  MAX(date) as date_fin,
  DATE_TRUNC('week', CURRENT_DATE) - INTERVAL '7 days' as lundi_dernier,
  DATE_TRUNC('week', CURRENT_DATE) as lundi_cette_semaine
FROM encaissements
WHERE date >= DATE_TRUNC('week', CURRENT_DATE) - INTERVAL '7 days'
  AND date < DATE_TRUNC('week', CURRENT_DATE);

-- Test 6: Liste tous les encaissements de la semaine dernière
SELECT
  'Tous les encaissements semaine dernière' as info,
  date,
  espece,
  cb,
  ch_vr,
  tr,
  total,
  created_at
FROM encaissements
WHERE date >= DATE_TRUNC('week', CURRENT_DATE) - INTERVAL '7 days'
  AND date < DATE_TRUNC('week', CURRENT_DATE)
ORDER BY date, created_at;

-- Test 7: Vérifier si CURRENT_DATE est bien aujourd'hui
SELECT
  'Vérification dates' as info,
  CURRENT_DATE as current_date_sql,
  NOW() as now_sql,
  EXTRACT(DOW FROM CURRENT_DATE) as jour_semaine,
  DATE_TRUNC('week', CURRENT_DATE) as debut_semaine_lundi;

-- Fin de la transaction - Commit si tout s'est bien passé
COMMIT;
