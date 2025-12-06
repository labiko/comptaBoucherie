-- Script pour mettre à jour toutes les dates vers décembre 2025
-- Date : 2025-12-06
-- Objectif : Afficher les données récentes dans les écrans

-- Début de la transaction
BEGIN;

-- Étape 0: Supprimer les données existantes en décembre 2025 pour éviter les conflits
DELETE FROM encaissements
WHERE EXTRACT(MONTH FROM date) = 12 AND EXTRACT(YEAR FROM date) = 2025;

DELETE FROM factures
WHERE EXTRACT(MONTH FROM date_facture) = 12 AND EXTRACT(YEAR FROM date_facture) = 2025;

-- Étape 1: Mettre à jour les encaissements
-- On garde le même jour du mois mais on change pour décembre 2025
UPDATE encaissements
SET date = (DATE '2025-12-01' + (EXTRACT(DAY FROM date)::integer - 1) * INTERVAL '1 day')::date
WHERE EXTRACT(MONTH FROM date) != 12 OR EXTRACT(YEAR FROM date) != 2025;

-- Étape 2: Mettre à jour les factures
UPDATE factures
SET
  date_facture = (DATE '2025-12-01' + (EXTRACT(DAY FROM date_facture)::integer - 1) * INTERVAL '1 day')::date,
  echeance = (DATE '2025-12-01' + (EXTRACT(DAY FROM echeance)::integer - 1) * INTERVAL '1 day')::date
WHERE EXTRACT(MONTH FROM date_facture) != 12 OR EXTRACT(YEAR FROM date_facture) != 2025;

-- Étape 3: Vérifier les résultats
SELECT 'Encaissements mis à jour :' as info, COUNT(*) as nombre, MIN(date) as date_min, MAX(date) as date_max
FROM encaissements
WHERE date >= '2025-12-01';

SELECT 'Factures mises à jour :' as info, COUNT(*) as nombre, MIN(date_facture) as date_min, MAX(date_facture) as date_max
FROM factures
WHERE date_facture >= '2025-12-01';

-- Message de confirmation
SELECT '✅ Toutes les données ont été mises à jour vers décembre 2025' as message;

-- Fin de la transaction - Commit si tout s'est bien passé
COMMIT;
