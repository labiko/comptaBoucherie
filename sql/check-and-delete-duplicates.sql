-- =====================================================
-- Script de détection et suppression des doublons de factures
-- =====================================================

-- ÉTAPE 1: Identifier les doublons (même boucherie_id + même date_facture)
SELECT
  boucherie_id,
  date_facture,
  COUNT(*) as nombre_factures,
  STRING_AGG(id::text, ', ') as ids_factures,
  STRING_AGG(fournisseur, ', ') as fournisseurs,
  STRING_AGG(montant::text, ', ') as montants
FROM factures
GROUP BY boucherie_id, date_facture
HAVING COUNT(*) > 1
ORDER BY date_facture DESC;

-- ÉTAPE 2: Voir le détail des doublons
SELECT
  id,
  boucherie_id,
  date_facture,
  fournisseur,
  description,
  montant,
  solde_restant,
  created_at,
  updated_at
FROM factures
WHERE (boucherie_id, date_facture) IN (
  SELECT boucherie_id, date_facture
  FROM factures
  GROUP BY boucherie_id, date_facture
  HAVING COUNT(*) > 1
)
ORDER BY date_facture DESC, created_at ASC;

-- ÉTAPE 3: Supprimer les doublons (garder uniquement le plus ancien = premier créé)
-- Cette requête supprime tous les doublons SAUF le premier créé (created_at le plus ancien)
BEGIN;

WITH doublons AS (
  SELECT
    id,
    boucherie_id,
    date_facture,
    created_at,
    ROW_NUMBER() OVER (
      PARTITION BY boucherie_id, date_facture
      ORDER BY created_at ASC
    ) as row_num
  FROM factures
)
DELETE FROM factures
WHERE id IN (
  SELECT id
  FROM doublons
  WHERE row_num > 1
)
RETURNING
  id,
  boucherie_id,
  date_facture,
  fournisseur,
  montant,
  created_at;

-- Si tout est OK, faire:
COMMIT;

-- Si il y a un problème, faire:
-- ROLLBACK;

-- ÉTAPE 4: Vérifier qu'il n'y a plus de doublons
SELECT
  boucherie_id,
  date_facture,
  COUNT(*) as nombre_factures
FROM factures
GROUP BY boucherie_id, date_facture
HAVING COUNT(*) > 1;
