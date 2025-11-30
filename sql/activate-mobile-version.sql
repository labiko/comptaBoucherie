-- Activer l'accès mobile pour toutes les boucheries actives
UPDATE boucheries
SET mobile_autorise = true
WHERE actif = true;

-- Vérifier les modifications
SELECT
  id,
  nom,
  mobile_autorise,
  actif,
  email_comptable
FROM boucheries
ORDER BY nom;
