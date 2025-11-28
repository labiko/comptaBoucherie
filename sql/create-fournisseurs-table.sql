-- =====================================================
-- Création de la table fournisseurs
-- Table liée à la boucherie pour gérer les fournisseurs
-- =====================================================

-- Début de la transaction
BEGIN;

-- 1. Créer la table fournisseurs
CREATE TABLE IF NOT EXISTS fournisseurs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  boucherie_id UUID NOT NULL REFERENCES boucheries(id) ON DELETE CASCADE,
  nom VARCHAR(255) NOT NULL,
  type VARCHAR(100), -- Type de fournisseur: viande, abattoir, services, etc.
  telephone VARCHAR(20),
  email VARCHAR(255),
  adresse TEXT,
  actif BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Index pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_fournisseurs_boucherie ON fournisseurs(boucherie_id);
CREATE INDEX IF NOT EXISTS idx_fournisseurs_actif ON fournisseurs(actif);
CREATE INDEX IF NOT EXISTS idx_fournisseurs_nom ON fournisseurs(nom);

-- 3. Trigger pour updated_at
CREATE OR REPLACE FUNCTION update_fournisseurs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER fournisseurs_updated_at
  BEFORE UPDATE ON fournisseurs
  FOR EACH ROW
  EXECUTE FUNCTION update_fournisseurs_updated_at();

-- 4. Ajouter la colonne fournisseur_id à la table factures
ALTER TABLE factures
  ADD COLUMN IF NOT EXISTS fournisseur_id UUID REFERENCES fournisseurs(id) ON DELETE SET NULL;

-- Index pour la nouvelle colonne
CREATE INDEX IF NOT EXISTS idx_factures_fournisseur ON factures(fournisseur_id);

-- 5. Insérer 5 fournisseurs de viande/abattoirs pour chaque boucherie
DO $$
DECLARE
  v_boucherie_id UUID;
BEGIN
  -- Pour chaque boucherie active
  FOR v_boucherie_id IN SELECT id FROM boucheries WHERE actif = true
  LOOP
    -- Insérer les 5 fournisseurs
    INSERT INTO fournisseurs (boucherie_id, nom, type, telephone, email, adresse, actif)
    VALUES
      (v_boucherie_id, 'Metro Cash & Carry', 'Grossiste viande', '01 48 92 00 00', 'contact@metro.fr', '93 Rue de la Belle Étoile, 95700 Roissy-en-France', true),
      (v_boucherie_id, 'Abattoir Régional', 'Abattoir', '02 40 50 30 20', 'commandes@abattoir-regional.fr', '12 Avenue des Agriculteurs, 44000 Nantes', true),
      (v_boucherie_id, 'Rungis Marée', 'Grossiste viande et marée', '01 46 87 23 45', 'contact@rungis-maree.fr', 'MIN de Rungis, Bât. B3, 94150 Rungis', true),
      (v_boucherie_id, 'Société Française de Viande (SFV)', 'Grossiste viande', '03 20 45 67 89', 'info@sfv-viande.fr', '45 Rue de l''Industrie, 59000 Lille', true),
      (v_boucherie_id, 'Comptoir des Viandes', 'Grossiste viande premium', '04 78 90 12 34', 'ventes@comptoir-viandes.fr', '78 Boulevard de la Viande, 69003 Lyon', true);

    RAISE NOTICE 'Fournisseurs créés pour la boucherie %', v_boucherie_id;
  END LOOP;
END $$;

-- 6. Migrer les fournisseurs existants dans les factures vers la nouvelle table
-- Pour chaque fournisseur unique dans les factures, créer une entrée dans fournisseurs
DO $$
DECLARE
  v_boucherie_id UUID;
  v_fournisseur_nom VARCHAR(255);
  v_fournisseur_id UUID;
BEGIN
  -- Pour chaque boucherie
  FOR v_boucherie_id IN SELECT DISTINCT boucherie_id FROM factures
  LOOP
    -- Pour chaque fournisseur unique de cette boucherie
    FOR v_fournisseur_nom IN
      SELECT DISTINCT fournisseur
      FROM factures
      WHERE boucherie_id = v_boucherie_id
        AND fournisseur IS NOT NULL
        AND fournisseur NOT IN (
          SELECT nom FROM fournisseurs WHERE boucherie_id = v_boucherie_id
        )
    LOOP
      -- Créer le fournisseur s'il n'existe pas déjà
      INSERT INTO fournisseurs (boucherie_id, nom, type, actif)
      VALUES (v_boucherie_id, v_fournisseur_nom, 'Autre', true)
      RETURNING id INTO v_fournisseur_id;

      -- Mettre à jour les factures avec le nouveau fournisseur_id
      UPDATE factures
      SET fournisseur_id = v_fournisseur_id
      WHERE boucherie_id = v_boucherie_id
        AND fournisseur = v_fournisseur_nom;

      RAISE NOTICE 'Fournisseur migré: % (ID: %)', v_fournisseur_nom, v_fournisseur_id;
    END LOOP;
  END LOOP;
END $$;

-- 7. Mettre à jour les factures qui ont des fournisseurs connus
DO $$
DECLARE
  v_facture RECORD;
  v_fournisseur_id UUID;
BEGIN
  FOR v_facture IN
    SELECT id, boucherie_id, fournisseur
    FROM factures
    WHERE fournisseur_id IS NULL
      AND fournisseur IS NOT NULL
  LOOP
    -- Chercher le fournisseur correspondant
    SELECT id INTO v_fournisseur_id
    FROM fournisseurs
    WHERE boucherie_id = v_facture.boucherie_id
      AND nom = v_facture.fournisseur
    LIMIT 1;

    -- Mettre à jour la facture
    IF v_fournisseur_id IS NOT NULL THEN
      UPDATE factures
      SET fournisseur_id = v_fournisseur_id
      WHERE id = v_facture.id;
    END IF;
  END LOOP;
END $$;

-- 8. Message de confirmation
SELECT
  '✅ Table fournisseurs créée avec succès !' as message,
  (SELECT COUNT(*) FROM fournisseurs) as total_fournisseurs,
  (SELECT COUNT(DISTINCT boucherie_id) FROM fournisseurs) as boucheries_avec_fournisseurs;

-- Fin de la transaction - Commit si tout s'est bien passé
COMMIT;
