-- Script de création de la table de traçabilité et des triggers
-- À exécuter sur Supabase

-- 1. Créer la table de traçabilité
CREATE TABLE IF NOT EXISTS tracabilite (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  boucherie_id UUID NOT NULL REFERENCES boucheries(id) ON DELETE CASCADE,

  -- Type d'opération
  table_name TEXT NOT NULL,
  record_id UUID NOT NULL,
  action TEXT NOT NULL,

  -- Qui et quand
  user_id UUID NOT NULL REFERENCES users(id),
  user_nom TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Détails de la modification
  old_values JSONB,
  new_values JSONB,

  -- Métadonnées
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Contraintes
  CONSTRAINT tracabilite_table_record CHECK (table_name IN ('encaissements', 'factures')),
  CONSTRAINT tracabilite_action CHECK (action IN ('CREATE', 'UPDATE', 'DELETE'))
);

-- 2. Créer les index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_tracabilite_boucherie ON tracabilite(boucherie_id);
CREATE INDEX IF NOT EXISTS idx_tracabilite_table_record ON tracabilite(table_name, record_id);
CREATE INDEX IF NOT EXISTS idx_tracabilite_timestamp ON tracabilite(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_tracabilite_user ON tracabilite(user_id);

-- 3. Fonction générique de traçabilité
CREATE OR REPLACE FUNCTION log_tracabilite()
RETURNS TRIGGER AS $$
DECLARE
  v_user_nom TEXT;
  v_user_id UUID;
BEGIN
  -- Récupérer les infos utilisateur depuis new ou old
  IF TG_OP = 'DELETE' THEN
    v_user_id := OLD.user_id;
  ELSE
    v_user_id := COALESCE(NEW.updated_by, NEW.user_id);
  END IF;

  -- Récupérer le nom de l'utilisateur
  SELECT nom INTO v_user_nom FROM users WHERE id = v_user_id;

  -- Insérer dans la table de traçabilité
  IF TG_OP = 'INSERT' THEN
    INSERT INTO tracabilite (
      boucherie_id,
      table_name,
      record_id,
      action,
      user_id,
      user_nom,
      old_values,
      new_values
    ) VALUES (
      NEW.boucherie_id,
      TG_TABLE_NAME,
      NEW.id,
      'CREATE',
      v_user_id,
      v_user_nom,
      NULL,
      row_to_json(NEW)::jsonb
    );
    RETURN NEW;

  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO tracabilite (
      boucherie_id,
      table_name,
      record_id,
      action,
      user_id,
      user_nom,
      old_values,
      new_values
    ) VALUES (
      NEW.boucherie_id,
      TG_TABLE_NAME,
      NEW.id,
      'UPDATE',
      v_user_id,
      v_user_nom,
      row_to_json(OLD)::jsonb,
      row_to_json(NEW)::jsonb
    );
    RETURN NEW;

  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO tracabilite (
      boucherie_id,
      table_name,
      record_id,
      action,
      user_id,
      user_nom,
      old_values,
      new_values
    ) VALUES (
      OLD.boucherie_id,
      TG_TABLE_NAME,
      OLD.id,
      'DELETE',
      v_user_id,
      v_user_nom,
      row_to_json(OLD)::jsonb,
      NULL
    );
    RETURN OLD;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- 4. Supprimer les anciens triggers s'ils existent
DROP TRIGGER IF EXISTS trg_tracabilite_encaissements ON encaissements;
DROP TRIGGER IF EXISTS trg_tracabilite_factures ON factures;

-- 5. Créer les triggers pour encaissements
CREATE TRIGGER trg_tracabilite_encaissements
AFTER INSERT OR UPDATE OR DELETE ON encaissements
FOR EACH ROW EXECUTE FUNCTION log_tracabilite();

-- 6. Créer les triggers pour factures
CREATE TRIGGER trg_tracabilite_factures
AFTER INSERT OR UPDATE OR DELETE ON factures
FOR EACH ROW EXECUTE FUNCTION log_tracabilite();

-- 7. Créer une vue enrichie pour faciliter les requêtes
CREATE OR REPLACE VIEW v_tracabilite_enrichie AS
SELECT
  t.id,
  t.boucherie_id,
  t.table_name,
  t.record_id,
  t.action,
  t.user_id,
  t.user_nom,
  t.timestamp,
  t.old_values,
  t.new_values,
  t.created_at,
  u.login as user_login,
  CASE
    WHEN t.table_name = 'encaissements' AND t.new_values IS NOT NULL THEN (t.new_values->>'date')::date
    WHEN t.table_name = 'encaissements' AND t.old_values IS NOT NULL THEN (t.old_values->>'date')::date
    WHEN t.table_name = 'factures' AND t.new_values IS NOT NULL THEN (t.new_values->>'date_facture')::date
    WHEN t.table_name = 'factures' AND t.old_values IS NOT NULL THEN (t.old_values->>'date_facture')::date
  END as record_date,
  CASE
    WHEN t.table_name = 'encaissements' AND t.new_values IS NOT NULL THEN (t.new_values->>'total')::numeric
    WHEN t.table_name = 'encaissements' AND t.old_values IS NOT NULL THEN (t.old_values->>'total')::numeric
    WHEN t.table_name = 'factures' AND t.new_values IS NOT NULL THEN (t.new_values->>'montant')::numeric
    WHEN t.table_name = 'factures' AND t.old_values IS NOT NULL THEN (t.old_values->>'montant')::numeric
  END as montant
FROM tracabilite t
LEFT JOIN users u ON t.user_id = u.id
ORDER BY t.timestamp DESC;

-- 8. Message de confirmation
SELECT 'Table de traçabilité créée avec succès ! Les triggers sont actifs.' as message;
