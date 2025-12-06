-- Vérifier la structure de la table factures
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'factures'
ORDER BY ordinal_position;
