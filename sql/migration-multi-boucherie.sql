-- Migration : Architecture Multi-Boucherie
-- Permet de gérer plusieurs boucheries avec leurs propres données

-- =============================================
-- 1. CRÉER LA TABLE BOUCHERIES
-- =============================================

CREATE TABLE IF NOT EXISTS boucheries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nom TEXT NOT NULL,
  adresse TEXT,
  code_postal TEXT,
  ville TEXT,
  siret TEXT,
  telephone TEXT,
  email TEXT,
  actif BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Trigger pour updated_at
CREATE TRIGGER update_boucheries_updated_at
  BEFORE UPDATE ON boucheries
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- 2. AJOUTER LA PREMIÈRE BOUCHERIE : Wissam SARL
-- =============================================

INSERT INTO boucheries (nom, adresse, code_postal, ville, siret, telephone, email)
VALUES (
  'Wissam SARL',
  '123 Avenue de la République',
  '75011',
  'Paris',
  '123 456 789 00012',
  '01 23 45 67 89',
  'contact@wissam-sarl.fr'
);

-- Stocker l'ID de Wissam SARL pour l'utiliser ensuite
DO $$
DECLARE
  wissam_id UUID;
BEGIN
  SELECT id INTO wissam_id FROM boucheries WHERE nom = 'Wissam SARL';

  -- Stocker temporairement dans une table
  CREATE TEMP TABLE IF NOT EXISTS temp_wissam_id (boucherie_id UUID);
  INSERT INTO temp_wissam_id VALUES (wissam_id);
END $$;

-- =============================================
-- 3. MODIFIER LA TABLE USERS
-- =============================================

-- Ajouter la colonne boucherie_id
ALTER TABLE users
ADD COLUMN IF NOT EXISTS boucherie_id UUID REFERENCES boucheries(id) ON DELETE RESTRICT;

-- Mettre à jour les utilisateurs existants pour les rattacher à Wissam SARL
UPDATE users
SET boucherie_id = (SELECT boucherie_id FROM temp_wissam_id)
WHERE boucherie_id IS NULL;

-- Rendre le champ obligatoire
ALTER TABLE users
ALTER COLUMN boucherie_id SET NOT NULL;

-- Créer un index pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_users_boucherie_id ON users(boucherie_id);

-- =============================================
-- 4. MODIFIER LA TABLE ENCAISSEMENTS
-- =============================================

-- Ajouter la colonne boucherie_id
ALTER TABLE encaissements
ADD COLUMN IF NOT EXISTS boucherie_id UUID REFERENCES boucheries(id) ON DELETE RESTRICT;

-- Mettre à jour les encaissements existants pour les rattacher à Wissam SARL
UPDATE encaissements
SET boucherie_id = (SELECT boucherie_id FROM temp_wissam_id)
WHERE boucherie_id IS NULL;

-- Rendre le champ obligatoire
ALTER TABLE encaissements
ALTER COLUMN boucherie_id SET NOT NULL;

-- Supprimer l'ancienne contrainte UNIQUE(date, user_id) si elle existe
ALTER TABLE encaissements
DROP CONSTRAINT IF EXISTS encaissements_date_user_id_key;

-- Supprimer l'ancienne contrainte UNIQUE(date) si elle existe
ALTER TABLE encaissements
DROP CONSTRAINT IF EXISTS encaissements_date_key;

-- Ajouter la nouvelle contrainte UNIQUE(boucherie_id, date)
ALTER TABLE encaissements
ADD CONSTRAINT encaissements_boucherie_date_key UNIQUE (boucherie_id, date);

-- Créer un index pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_encaissements_boucherie_id ON encaissements(boucherie_id);

-- =============================================
-- 5. MODIFIER LA TABLE FACTURES
-- =============================================

-- Ajouter la colonne boucherie_id
ALTER TABLE factures
ADD COLUMN IF NOT EXISTS boucherie_id UUID REFERENCES boucheries(id) ON DELETE RESTRICT;

-- Mettre à jour les factures existantes pour les rattacher à Wissam SARL
UPDATE factures
SET boucherie_id = (SELECT boucherie_id FROM temp_wissam_id)
WHERE boucherie_id IS NULL;

-- Rendre le champ obligatoire
ALTER TABLE factures
ALTER COLUMN boucherie_id SET NOT NULL;

-- Supprimer les anciennes contraintes si elles existent
ALTER TABLE factures
DROP CONSTRAINT IF EXISTS factures_date_user_id_key;

-- Créer un index pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_factures_boucherie_id ON factures(boucherie_id);

-- =============================================
-- 6. METTRE À JOUR LES VUES
-- =============================================

-- Recréer la vue encaissements_mois_courant avec boucherie_id
DROP VIEW IF EXISTS encaissements_mois_courant;
CREATE VIEW encaissements_mois_courant AS
SELECT *
FROM encaissements
WHERE EXTRACT(YEAR FROM date) = EXTRACT(YEAR FROM CURRENT_DATE)
  AND EXTRACT(MONTH FROM date) = EXTRACT(MONTH FROM CURRENT_DATE);

-- Recréer la vue factures_mois_courant avec boucherie_id
DROP VIEW IF EXISTS factures_mois_courant;
CREATE VIEW factures_mois_courant AS
SELECT *
FROM factures
WHERE EXTRACT(YEAR FROM date_facture) = EXTRACT(YEAR FROM CURRENT_DATE)
  AND EXTRACT(MONTH FROM date_facture) = EXTRACT(MONTH FROM CURRENT_DATE);

-- Recréer la vue encaissements_archives avec boucherie_id
DROP VIEW IF EXISTS encaissements_archives;
CREATE VIEW encaissements_archives AS
SELECT *
FROM encaissements
WHERE (EXTRACT(YEAR FROM date) < EXTRACT(YEAR FROM CURRENT_DATE))
   OR (EXTRACT(YEAR FROM date) = EXTRACT(YEAR FROM CURRENT_DATE)
       AND EXTRACT(MONTH FROM date) < EXTRACT(MONTH FROM CURRENT_DATE));

-- Recréer la vue factures_archives avec boucherie_id
DROP VIEW IF EXISTS factures_archives;
CREATE VIEW factures_archives AS
SELECT *
FROM factures
WHERE (EXTRACT(YEAR FROM date_facture) < EXTRACT(YEAR FROM CURRENT_DATE))
   OR (EXTRACT(YEAR FROM date_facture) = EXTRACT(YEAR FROM CURRENT_DATE)
       AND EXTRACT(MONTH FROM date_facture) < EXTRACT(MONTH FROM CURRENT_DATE));

-- =============================================
-- 7. METTRE À JOUR LA FONCTION get_mois_archives
-- =============================================

DROP FUNCTION IF EXISTS get_mois_archives(UUID);

CREATE OR REPLACE FUNCTION get_mois_archives(p_boucherie_id UUID)
RETURNS TABLE (
  annee INTEGER,
  mois INTEGER,
  nb_encaissements BIGINT,
  nb_factures BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    EXTRACT(YEAR FROM e.date)::INTEGER as annee,
    EXTRACT(MONTH FROM e.date)::INTEGER as mois,
    COUNT(DISTINCT e.id) as nb_encaissements,
    COUNT(DISTINCT f.id) as nb_factures
  FROM encaissements e
  LEFT JOIN factures f ON
    EXTRACT(YEAR FROM f.date_facture) = EXTRACT(YEAR FROM e.date)
    AND EXTRACT(MONTH FROM f.date_facture) = EXTRACT(MONTH FROM e.date)
    AND f.boucherie_id = p_boucherie_id
  WHERE e.boucherie_id = p_boucherie_id
    AND (
      EXTRACT(YEAR FROM e.date) < EXTRACT(YEAR FROM CURRENT_DATE)
      OR (
        EXTRACT(YEAR FROM e.date) = EXTRACT(YEAR FROM CURRENT_DATE)
        AND EXTRACT(MONTH FROM e.date) < EXTRACT(MONTH FROM CURRENT_DATE)
      )
    )
  GROUP BY annee, mois
  ORDER BY annee DESC, mois DESC;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- 8. VÉRIFICATIONS
-- =============================================

-- Afficher la boucherie créée
SELECT
  'Boucherie créée' as action,
  id,
  nom,
  ville,
  siret
FROM boucheries;

-- Afficher les utilisateurs rattachés
SELECT
  'Utilisateurs rattachés' as action,
  u.login,
  u.nom,
  b.nom as boucherie
FROM users u
JOIN boucheries b ON u.boucherie_id = b.id;

-- Afficher les encaissements rattachés
SELECT
  'Encaissements rattachés' as action,
  COUNT(*) as nombre,
  b.nom as boucherie
FROM encaissements e
JOIN boucheries b ON e.boucherie_id = b.id
GROUP BY b.nom;

-- Nettoyage
DROP TABLE IF EXISTS temp_wissam_id;

SELECT '✅ Migration terminée : Architecture multi-boucherie activée avec Wissam SARL' as message;
