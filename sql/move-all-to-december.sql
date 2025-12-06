-- Script pour déplacer toutes les données vers décembre 2025
-- Date : 2025-12-06
-- Objectif : Afficher les données récentes dans les écrans
-- Stratégie : Supprimer tout et recréer uniquement les données de novembre en décembre

-- Début de la transaction
BEGIN;

-- Étape 1: Compter les données actuelles
SELECT 'Avant migration - Encaissements :' as info,
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE EXTRACT(MONTH FROM date) = 11) as novembre,
  COUNT(*) FILTER (WHERE EXTRACT(MONTH FROM date) = 12) as decembre
FROM encaissements;

SELECT 'Avant migration - Factures :' as info,
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE EXTRACT(MONTH FROM date_facture) = 11) as novembre,
  COUNT(*) FILTER (WHERE EXTRACT(MONTH FROM date_facture) = 12) as decembre
FROM factures;

-- Étape 2: Créer des tables temporaires avec les données de novembre converties en décembre
CREATE TEMP TABLE temp_encaissements AS
SELECT
  id,
  (DATE '2025-12-01' + (EXTRACT(DAY FROM date)::integer - 1) * INTERVAL '1 day')::date as new_date,
  espece,
  cb,
  ch_vr,
  tr,
  total,
  user_id,
  created_at,
  updated_at,
  updated_by,
  boucherie_id
FROM encaissements
WHERE EXTRACT(MONTH FROM date) = 11 AND EXTRACT(YEAR FROM date) = 2025;

CREATE TEMP TABLE temp_factures AS
SELECT
  id,
  (DATE '2025-12-01' + (EXTRACT(DAY FROM date_facture)::integer - 1) * INTERVAL '1 day')::date as new_date_facture,
  (DATE '2025-12-01' + (EXTRACT(DAY FROM echeance)::integer - 1) * INTERVAL '1 day')::date as new_echeance,
  fournisseur,
  description,
  montant,
  mode_reglement,
  solde_restant,
  user_id,
  created_at,
  updated_at,
  updated_by,
  boucherie_id,
  regle,
  fournisseur_id,
  piece_jointe,
  piece_jointe_updated_at
FROM factures
WHERE EXTRACT(MONTH FROM date_facture) = 11 AND EXTRACT(YEAR FROM date_facture) = 2025;

-- Étape 3: Supprimer TOUTES les données (novembre + décembre)
DELETE FROM encaissements
WHERE (EXTRACT(MONTH FROM date) = 11 OR EXTRACT(MONTH FROM date) = 12)
  AND EXTRACT(YEAR FROM date) = 2025;

DELETE FROM factures
WHERE (EXTRACT(MONTH FROM date_facture) = 11 OR EXTRACT(MONTH FROM date_facture) = 12)
  AND EXTRACT(YEAR FROM date_facture) = 2025;

-- Étape 4: Insérer les données de novembre converties en décembre
INSERT INTO encaissements (
  id, date, espece, cb, ch_vr, tr, total,
  user_id, created_at, updated_at, updated_by, boucherie_id
)
SELECT
  id, new_date, espece, cb, ch_vr, tr, total,
  user_id, created_at, updated_at, updated_by, boucherie_id
FROM temp_encaissements;

INSERT INTO factures (
  id, date_facture, echeance, fournisseur, description, montant,
  mode_reglement, solde_restant, user_id, created_at, updated_at,
  updated_by, boucherie_id, regle, fournisseur_id, piece_jointe, piece_jointe_updated_at
)
SELECT
  id, new_date_facture, new_echeance, fournisseur, description, montant,
  mode_reglement, solde_restant, user_id, created_at, updated_at,
  updated_by, boucherie_id, regle, fournisseur_id, piece_jointe, piece_jointe_updated_at
FROM temp_factures;

-- Étape 5: Vérifier les résultats
SELECT 'Après migration - Encaissements :' as info,
  COUNT(*) as total_decembre,
  MIN(date) as date_min,
  MAX(date) as date_max
FROM encaissements
WHERE EXTRACT(MONTH FROM date) = 12 AND EXTRACT(YEAR FROM date) = 2025;

SELECT 'Après migration - Factures :' as info,
  COUNT(*) as total_decembre,
  MIN(date_facture) as date_min,
  MAX(date_facture) as date_max
FROM factures
WHERE EXTRACT(MONTH FROM date_facture) = 12 AND EXTRACT(YEAR FROM date_facture) = 2025;

-- Message de confirmation
SELECT '✅ Migration terminée : Toutes les données sont maintenant en décembre 2025' as message;

-- Fin de la transaction - Commit si tout s'est bien passé
COMMIT;
