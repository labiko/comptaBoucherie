-- Vérifier l'état actuel des données

-- Encaissements par mois
SELECT
  EXTRACT(YEAR FROM date) as annee,
  EXTRACT(MONTH FROM date) as mois,
  COUNT(*) as nombre,
  MIN(date) as date_min,
  MAX(date) as date_max
FROM encaissements
GROUP BY EXTRACT(YEAR FROM date), EXTRACT(MONTH FROM date)
ORDER BY annee DESC, mois DESC;

-- Factures par mois
SELECT
  EXTRACT(YEAR FROM date_facture) as annee,
  EXTRACT(MONTH FROM date_facture) as mois,
  COUNT(*) as nombre,
  MIN(date_facture) as date_min,
  MAX(date_facture) as date_max
FROM factures
GROUP BY EXTRACT(YEAR FROM date_facture), EXTRACT(MONTH FROM date_facture)
ORDER BY annee DESC, mois DESC;

-- Détail des encaissements
SELECT
  date,
  boucherie_id,
  espece,
  cb,
  ch_vr,
  tr,
  total
FROM encaissements
ORDER BY date DESC
LIMIT 20;
