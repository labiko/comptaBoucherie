-- Script de nettoyage des données de la période 2025-01-01 à 2025-12-06
-- À exécuter AVANT le script de génération

BEGIN;

-- Supprimer les encaissements de la période
DELETE FROM encaissements
WHERE date >= '2025-01-01' AND date <= '2025-12-06';

-- Supprimer les factures de la période
DELETE FROM factures
WHERE date_facture >= '2025-01-01' AND date_facture <= '2025-12-06';

-- Vérification
SELECT
    'Encaissements supprimés' AS action,
    COUNT(*) AS reste
FROM encaissements
WHERE date >= '2025-01-01' AND date <= '2025-12-06'

UNION ALL

SELECT
    'Factures supprimées' AS action,
    COUNT(*) AS reste
FROM factures
WHERE date_facture >= '2025-01-01' AND date_facture <= '2025-12-06';

COMMIT;
