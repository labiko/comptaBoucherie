-- Script pour mettre à jour les données de test de 2024 vers 2025
-- À exécuter dans l'éditeur SQL de Supabase

-- Mettre à jour les dates des encaissements de 2024 vers 2025
UPDATE encaissements
SET date = date + INTERVAL '1 year'
WHERE EXTRACT(YEAR FROM date) = 2024;

-- Mettre à jour les dates des factures de 2024 vers 2025
UPDATE factures
SET date_facture = date_facture + INTERVAL '1 year',
    echeance = echeance + INTERVAL '1 year'
WHERE EXTRACT(YEAR FROM date_facture) = 2024;

-- Vérifier les résultats
SELECT
  'Encaissements novembre 2025' as type,
  COUNT(*) as nombre,
  SUM(total) as total_montant
FROM encaissements
WHERE EXTRACT(YEAR FROM date) = 2025
  AND EXTRACT(MONTH FROM date) = 11

UNION ALL

SELECT
  'Factures novembre 2025' as type,
  COUNT(*) as nombre,
  SUM(montant) as total_montant
FROM factures
WHERE EXTRACT(YEAR FROM date_facture) = 2025
  AND EXTRACT(MONTH FROM date_facture) = 11;

-- Afficher les encaissements mis à jour
SELECT
  date,
  espece,
  cb,
  ch_vr,
  tr,
  total
FROM encaissements
WHERE EXTRACT(YEAR FROM date) = 2025
  AND EXTRACT(MONTH FROM date) = 11
ORDER BY date;
