-- Migration : Ajouter le champ updated_by pour tracer qui a modifié chaque ligne
-- À exécuter après supabase-schema.sql

-- Ajouter le champ updated_by à la table encaissements
ALTER TABLE encaissements
ADD COLUMN updated_by UUID REFERENCES users(id) ON DELETE RESTRICT;

-- Mettre à jour les lignes existantes avec le user_id initial
UPDATE encaissements
SET updated_by = user_id
WHERE updated_by IS NULL;

-- Ajouter le champ updated_by à la table factures
ALTER TABLE factures
ADD COLUMN updated_by UUID REFERENCES users(id) ON DELETE RESTRICT;

-- Mettre à jour les lignes existantes avec le user_id initial
UPDATE factures
SET updated_by = user_id
WHERE updated_by IS NULL;

-- Créer un trigger pour mettre à jour automatiquement updated_by lors d'une modification
CREATE OR REPLACE FUNCTION update_updated_by_column()
RETURNS TRIGGER AS $$
BEGIN
  -- Note: updated_by doit être défini explicitement dans l'UPDATE
  -- Ce trigger met juste à jour updated_at
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Remplacer les triggers existants
DROP TRIGGER IF EXISTS update_encaissements_updated_at ON encaissements;
CREATE TRIGGER update_encaissements_updated_at
  BEFORE UPDATE ON encaissements
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_by_column();

DROP TRIGGER IF EXISTS update_factures_updated_at ON factures;
CREATE TRIGGER update_factures_updated_at
  BEFORE UPDATE ON factures
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_by_column();

-- Créer un index pour améliorer les performances
CREATE INDEX idx_encaissements_updated_by ON encaissements(updated_by);
CREATE INDEX idx_factures_updated_by ON factures(updated_by);

SELECT 'Migration terminée : champ updated_by ajouté aux tables encaissements et factures' as message;
