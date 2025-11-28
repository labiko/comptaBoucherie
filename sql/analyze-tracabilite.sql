-- Script d'analyse de la traçabilité
-- À exécuter dans Supabase SQL Editor

-- 1. Vérifier les 10 dernières entrées de traçabilité
SELECT
  id,
  table_name,
  action,
  user_nom,
  timestamp,
  CASE
    WHEN old_values IS NULL THEN 'NULL'
    ELSE 'OK'
  END as old_values_status,
  CASE
    WHEN new_values IS NULL THEN 'NULL'
    ELSE 'OK'
  END as new_values_status,
  jsonb_object_keys(old_values) as old_keys_count,
  jsonb_object_keys(new_values) as new_keys_count
FROM tracabilite
ORDER BY timestamp DESC
LIMIT 10;

-- 2. Vérifier si les triggers sont actifs
SELECT
  trigger_name,
  event_object_table,
  action_statement,
  action_timing,
  event_manipulation
FROM information_schema.triggers
WHERE trigger_name LIKE 'trg_tracabilite%'
ORDER BY event_object_table;

-- 3. Compter les logs par type et action
SELECT
  table_name,
  action,
  COUNT(*) as nombre,
  COUNT(CASE WHEN old_values IS NULL THEN 1 END) as old_null,
  COUNT(CASE WHEN new_values IS NULL THEN 1 END) as new_null
FROM tracabilite
GROUP BY table_name, action
ORDER BY table_name, action;

-- 4. Exemple détaillé d'un UPDATE avec les valeurs
SELECT
  id,
  table_name,
  action,
  user_nom,
  timestamp,
  old_values,
  new_values
FROM tracabilite
WHERE action = 'UPDATE'
  AND old_values IS NOT NULL
  AND new_values IS NOT NULL
ORDER BY timestamp DESC
LIMIT 3;

-- 5. Vérifier les champs qui changent dans les UPDATE
WITH changed_fields AS (
  SELECT
    id,
    jsonb_object_keys(old_values) as field_name,
    old_values,
    new_values
  FROM tracabilite
  WHERE action = 'UPDATE'
    AND old_values IS NOT NULL
    AND new_values IS NOT NULL
  LIMIT 10
)
SELECT
  cf.id,
  cf.field_name,
  cf.old_values->>cf.field_name as old_value,
  cf.new_values->>cf.field_name as new_value,
  CASE
    WHEN cf.old_values->>cf.field_name = cf.new_values->>cf.field_name THEN 'IDENTICAL'
    ELSE 'CHANGED'
  END as status
FROM changed_fields cf
WHERE cf.field_name NOT IN ('updated_at', 'created_at', 'id', 'boucherie_id', 'user_id', 'updated_by')
ORDER BY cf.id, cf.field_name;

-- 6. Statistiques globales
SELECT
  'Total logs' as metric,
  COUNT(*)::text as value
FROM tracabilite
UNION ALL
SELECT
  'Logs avec old_values NULL',
  COUNT(*)::text
FROM tracabilite
WHERE old_values IS NULL
UNION ALL
SELECT
  'Logs avec new_values NULL',
  COUNT(*)::text
FROM tracabilite
WHERE new_values IS NULL
UNION ALL
SELECT
  'UPDATE sans changement réel',
  COUNT(*)::text
FROM tracabilite
WHERE action = 'UPDATE'
  AND old_values = new_values;
