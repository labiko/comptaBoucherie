-- Script d'analyse des données générées
-- À exécuter dans le SQL Editor de Supabase

-- ================================================
-- ANALYSE DES ENCAISSEMENTS
-- ================================================

SELECT
    '=== ENCAISSEMENTS ===' AS section,
    '' AS details;

SELECT
    'Nombre total' AS statistique,
    COUNT(*)::TEXT AS valeur
FROM encaissements
WHERE date >= '2025-01-01' AND date <= '2025-12-06'

UNION ALL

SELECT
    'Date min' AS statistique,
    TO_CHAR(MIN(date), 'DD/MM/YYYY') AS valeur
FROM encaissements
WHERE date >= '2025-01-01' AND date <= '2025-12-06'

UNION ALL

SELECT
    'Date max' AS statistique,
    TO_CHAR(MAX(date), 'DD/MM/YYYY') AS valeur
FROM encaissements
WHERE date >= '2025-01-01' AND date <= '2025-12-06'

UNION ALL

SELECT
    'Total Espèce' AS statistique,
    TO_CHAR(ROUND(SUM(espece), 2), 'FM999,999,999.00') || ' €' AS valeur
FROM encaissements
WHERE date >= '2025-01-01' AND date <= '2025-12-06'

UNION ALL

SELECT
    'Total CB' AS statistique,
    TO_CHAR(ROUND(SUM(cb), 2), 'FM999,999,999.00') || ' €' AS valeur
FROM encaissements
WHERE date >= '2025-01-01' AND date <= '2025-12-06'

UNION ALL

SELECT
    'Total CH/VR' AS statistique,
    TO_CHAR(ROUND(SUM(ch_vr), 2), 'FM999,999,999.00') || ' €' AS valeur
FROM encaissements
WHERE date >= '2025-01-01' AND date <= '2025-12-06'

UNION ALL

SELECT
    'Total TR' AS statistique,
    TO_CHAR(ROUND(SUM(tr), 2), 'FM999,999,999.00') || ' €' AS valeur
FROM encaissements
WHERE date >= '2025-01-01' AND date <= '2025-12-06'

UNION ALL

SELECT
    'TOTAL GÉNÉRAL' AS statistique,
    TO_CHAR(ROUND(SUM(total), 2), 'FM999,999,999.00') || ' €' AS valeur
FROM encaissements
WHERE date >= '2025-01-01' AND date <= '2025-12-06'

UNION ALL

SELECT
    'Moyenne par jour' AS statistique,
    TO_CHAR(ROUND(AVG(total), 2), 'FM999,999,999.00') || ' €' AS valeur
FROM encaissements
WHERE date >= '2025-01-01' AND date <= '2025-12-06';

-- ================================================
-- ÉCHANTILLON ENCAISSEMENTS
-- ================================================

SELECT
    '=== ÉCHANTILLON ENCAISSEMENTS (5 premiers) ===' AS section;

SELECT
    TO_CHAR(date, 'DD/MM/YYYY') AS date,
    TO_CHAR(espece, 'FM999,999.00') || ' €' AS espece,
    TO_CHAR(cb, 'FM999,999.00') || ' €' AS cb,
    TO_CHAR(ch_vr, 'FM999,999.00') || ' €' AS ch_vr,
    TO_CHAR(tr, 'FM999,999.00') || ' €' AS tr,
    TO_CHAR(total, 'FM999,999.00') || ' €' AS total
FROM encaissements
WHERE date >= '2025-01-01' AND date <= '2025-12-06'
ORDER BY date ASC
LIMIT 5;

SELECT
    '=== ÉCHANTILLON ENCAISSEMENTS (5 derniers) ===' AS section;

SELECT
    TO_CHAR(date, 'DD/MM/YYYY') AS date,
    TO_CHAR(espece, 'FM999,999.00') || ' €' AS espece,
    TO_CHAR(cb, 'FM999,999.00') || ' €' AS cb,
    TO_CHAR(ch_vr, 'FM999,999.00') || ' €' AS ch_vr,
    TO_CHAR(tr, 'FM999,999.00') || ' €' AS tr,
    TO_CHAR(total, 'FM999,999.00') || ' €' AS total
FROM encaissements
WHERE date >= '2025-01-01' AND date <= '2025-12-06'
ORDER BY date DESC
LIMIT 5;

-- ================================================
-- ANALYSE DES FACTURES
-- ================================================

SELECT
    '=== FACTURES ===' AS section,
    '' AS details;

SELECT
    'Nombre total' AS statistique,
    COUNT(*)::TEXT AS valeur
FROM factures
WHERE date_facture >= '2025-01-01' AND date_facture <= '2025-12-06'

UNION ALL

SELECT
    'Date min' AS statistique,
    TO_CHAR(MIN(date_facture), 'DD/MM/YYYY') AS valeur
FROM factures
WHERE date_facture >= '2025-01-01' AND date_facture <= '2025-12-06'

UNION ALL

SELECT
    'Date max' AS statistique,
    TO_CHAR(MAX(date_facture), 'DD/MM/YYYY') AS valeur
FROM factures
WHERE date_facture >= '2025-01-01' AND date_facture <= '2025-12-06'

UNION ALL

SELECT
    'Montant total' AS statistique,
    TO_CHAR(ROUND(SUM(montant), 2), 'FM999,999,999.00') || ' €' AS valeur
FROM factures
WHERE date_facture >= '2025-01-01' AND date_facture <= '2025-12-06'

UNION ALL

SELECT
    'Factures réglées' AS statistique,
    COUNT(*) || ' (' || TO_CHAR(ROUND(SUM(montant), 2), 'FM999,999,999.00') || ' €)' AS valeur
FROM factures
WHERE date_facture >= '2025-01-01' AND date_facture <= '2025-12-06'
  AND regle = true

UNION ALL

SELECT
    'Factures non réglées' AS statistique,
    COUNT(*) || ' (' || TO_CHAR(ROUND(SUM(montant), 2), 'FM999,999,999.00') || ' €)' AS valeur
FROM factures
WHERE date_facture >= '2025-01-01' AND date_facture <= '2025-12-06'
  AND regle = false

UNION ALL

SELECT
    'Solde restant total' AS statistique,
    TO_CHAR(ROUND(SUM(solde_restant), 2), 'FM999,999,999.00') || ' €' AS valeur
FROM factures
WHERE date_facture >= '2025-01-01' AND date_facture <= '2025-12-06'

UNION ALL

SELECT
    'Moyenne par facture' AS statistique,
    TO_CHAR(ROUND(AVG(montant), 2), 'FM999,999,999.00') || ' €' AS valeur
FROM factures
WHERE date_facture >= '2025-01-01' AND date_facture <= '2025-12-06';

-- ================================================
-- RÉPARTITION PAR FOURNISSEUR
-- ================================================

SELECT
    '=== RÉPARTITION PAR FOURNISSEUR ===' AS section;

SELECT
    fournisseur,
    COUNT(*) AS nb_factures,
    TO_CHAR(ROUND(SUM(montant), 2), 'FM999,999,999.00') || ' €' AS total,
    TO_CHAR(ROUND(AVG(montant), 2), 'FM999,999.00') || ' €' AS moyenne
FROM factures
WHERE date_facture >= '2025-01-01' AND date_facture <= '2025-12-06'
GROUP BY fournisseur
ORDER BY SUM(montant) DESC;

-- ================================================
-- RÉPARTITION PAR MODE DE RÈGLEMENT
-- ================================================

SELECT
    '=== RÉPARTITION PAR MODE DE RÈGLEMENT ===' AS section;

SELECT
    mode_reglement,
    COUNT(*) AS nb_factures,
    TO_CHAR(ROUND(SUM(montant), 2), 'FM999,999,999.00') || ' €' AS total,
    TO_CHAR(ROUND(AVG(montant), 2), 'FM999,999.00') || ' €' AS moyenne
FROM factures
WHERE date_facture >= '2025-01-01' AND date_facture <= '2025-12-06'
GROUP BY mode_reglement
ORDER BY SUM(montant) DESC;

-- ================================================
-- ÉCHANTILLON FACTURES
-- ================================================

SELECT
    '=== ÉCHANTILLON FACTURES (5 premières) ===' AS section;

SELECT
    TO_CHAR(date_facture, 'DD/MM/YYYY') AS date,
    fournisseur,
    LEFT(description, 30) || '...' AS description,
    TO_CHAR(montant, 'FM999,999.00') || ' €' AS montant,
    mode_reglement,
    CASE WHEN regle THEN '✓ Réglé' ELSE '✗ Non réglé' END AS statut,
    TO_CHAR(solde_restant, 'FM999,999.00') || ' €' AS solde
FROM factures
WHERE date_facture >= '2025-01-01' AND date_facture <= '2025-12-06'
ORDER BY date_facture ASC, created_at ASC
LIMIT 5;

SELECT
    '=== ÉCHANTILLON FACTURES (5 dernières) ===' AS section;

SELECT
    TO_CHAR(date_facture, 'DD/MM/YYYY') AS date,
    fournisseur,
    LEFT(description, 30) || '...' AS description,
    TO_CHAR(montant, 'FM999,999.00') || ' €' AS montant,
    mode_reglement,
    CASE WHEN regle THEN '✓ Réglé' ELSE '✗ Non réglé' END AS statut,
    TO_CHAR(solde_restant, 'FM999,999.00') || ' €' AS solde
FROM factures
WHERE date_facture >= '2025-01-01' AND date_facture <= '2025-12-06'
ORDER BY date_facture DESC, created_at DESC
LIMIT 5;

-- ================================================
-- RÉSUMÉ GLOBAL
-- ================================================

SELECT
    '=== RÉSUMÉ GLOBAL ===' AS section;

WITH stats AS (
    SELECT
        (SELECT COALESCE(SUM(total), 0) FROM encaissements WHERE date >= '2025-01-01' AND date <= '2025-12-06') AS total_enc,
        (SELECT COALESCE(SUM(montant), 0) FROM factures WHERE date_facture >= '2025-01-01' AND date_facture <= '2025-12-06') AS total_fact,
        (SELECT COUNT(*) FROM encaissements WHERE date >= '2025-01-01' AND date <= '2025-12-06') AS nb_enc,
        (SELECT COUNT(*) FROM factures WHERE date_facture >= '2025-01-01' AND date_facture <= '2025-12-06') AS nb_fact
)
SELECT
    'Total encaissements' AS type,
    TO_CHAR(ROUND(total_enc, 2), 'FM999,999,999.00') || ' €' AS montant,
    nb_enc::TEXT || ' lignes' AS details
FROM stats

UNION ALL

SELECT
    'Total factures' AS type,
    TO_CHAR(ROUND(total_fact, 2), 'FM999,999,999.00') || ' €' AS montant,
    nb_fact::TEXT || ' lignes' AS details
FROM stats

UNION ALL

SELECT
    'SOLDE' AS type,
    TO_CHAR(ROUND(total_enc - total_fact, 2), 'FM999,999,999.00') || ' €' AS montant,
    CASE
        WHEN total_enc - total_fact >= 0 THEN '💚 Positif'
        ELSE '❤️ Négatif'
    END AS details
FROM stats

UNION ALL

SELECT
    'TOTAL LIGNES' AS type,
    (nb_enc + nb_fact)::TEXT AS montant,
    'encaissements + factures' AS details
FROM stats;

-- ================================================
-- DISTRIBUTION MENSUELLE
-- ================================================

SELECT
    '=== DISTRIBUTION MENSUELLE ===' AS section;

WITH mois_enc AS (
    SELECT
        TO_CHAR(date, 'YYYY-MM') AS mois,
        COUNT(*) AS nb_enc,
        SUM(total) AS total_enc
    FROM encaissements
    WHERE date >= '2025-01-01' AND date <= '2025-12-06'
    GROUP BY TO_CHAR(date, 'YYYY-MM')
),
mois_fact AS (
    SELECT
        TO_CHAR(date_facture, 'YYYY-MM') AS mois,
        COUNT(*) AS nb_fact,
        SUM(montant) AS total_fact
    FROM factures
    WHERE date_facture >= '2025-01-01' AND date_facture <= '2025-12-06'
    GROUP BY TO_CHAR(date_facture, 'YYYY-MM')
)
SELECT
    COALESCE(e.mois, f.mois) AS mois,
    COALESCE(e.nb_enc, 0) AS encaissements,
    TO_CHAR(ROUND(COALESCE(e.total_enc, 0), 2), 'FM999,999,999.00') || ' €' AS montant_enc,
    COALESCE(f.nb_fact, 0) AS factures,
    TO_CHAR(ROUND(COALESCE(f.total_fact, 0), 2), 'FM999,999,999.00') || ' €' AS montant_fact,
    TO_CHAR(ROUND(COALESCE(e.total_enc, 0) - COALESCE(f.total_fact, 0), 2), 'FM999,999,999.00') || ' €' AS solde
FROM mois_enc e
FULL OUTER JOIN mois_fact f ON e.mois = f.mois
ORDER BY COALESCE(e.mois, f.mois);
