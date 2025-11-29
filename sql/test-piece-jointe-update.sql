-- =====================================================
-- Script de test pour la mise à jour des pièces jointes
-- =====================================================
-- Ce script teste la mise à jour manuelle d'une pièce jointe
-- Remplacez les valeurs entre <> par vos valeurs réelles
-- =====================================================

-- ÉTAPE 1: Trouver une facture à tester (facture du 28/11/2024 par exemple)
SELECT
  id,
  date_facture,
  fournisseur,
  description,
  piece_jointe,
  piece_jointe_updated_at
FROM factures
WHERE date_facture = '2024-11-28'
ORDER BY created_at DESC
LIMIT 5;

-- ÉTAPE 2: Tester la mise à jour (DÉCOMMENTEZ ET REMPLACEZ LES VALEURS)
-- Remplacez:
-- - <FACTURE_ID> par l'ID de la facture trouvée à l'étape 1
-- - <IMAGE_URL> par l'URL de l'image uploadée
-- Exemple:
/*
BEGIN;

UPDATE factures
SET
  piece_jointe = 'https://ylhwyotluskuhkjumqpf.supabase.co/storage/v1/object/public/factures-images/778d79ff-521c-4cb0-a549-02d5dedd9b44/bb504dbd-30df-49a6-aaa8-1d3f40f1e1f8.png',
  piece_jointe_updated_at = NOW()
WHERE id = '<FACTURE_ID>'
RETURNING
  id,
  date_facture,
  fournisseur,
  piece_jointe,
  piece_jointe_updated_at;

-- Si tout va bien, faire:
COMMIT;

-- Si il y a un problème, faire:
-- ROLLBACK;
*/

-- ÉTAPE 3: Vérifier la mise à jour
/*
SELECT
  id,
  date_facture,
  fournisseur,
  piece_jointe,
  piece_jointe_updated_at,
  updated_at
FROM factures
WHERE id = '<FACTURE_ID>';
*/
