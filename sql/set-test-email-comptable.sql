-- Configuration de l'email comptable pour test
-- Date : 2025-01-30

-- Mettre à jour l'email comptable pour toutes les boucheries
UPDATE boucheries
SET email_comptable = 'diallo.labico@hotmail.fr'
WHERE actif = true;

-- Vérifier la mise à jour
SELECT
  id,
  nom,
  email_comptable,
  envoi_auto_factures
FROM boucheries
WHERE actif = true;
