-- =====================================================
-- Amélioration du trigger de traçabilité
-- Empêche la création de logs UPDATE vides
-- =====================================================

-- Début de la transaction
BEGIN;

-- 1. Fonction améliorée de traçabilité avec détection des changements
CREATE OR REPLACE FUNCTION log_tracabilite()
RETURNS TRIGGER AS $$
DECLARE
  v_user_nom TEXT;
  v_user_id UUID;
  v_old_json JSONB;
  v_new_json JSONB;
  v_has_changes BOOLEAN;
  v_key TEXT;
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
    -- Convertir OLD et NEW en JSONB
    v_old_json := row_to_json(OLD)::jsonb;
    v_new_json := row_to_json(NEW)::jsonb;

    -- Vérifier si au moins un champ métier a changé
    -- On ignore les champs techniques: id, boucherie_id, user_id, updated_by, created_at, updated_at
    v_has_changes := FALSE;

    FOR v_key IN
      SELECT key
      FROM jsonb_object_keys(v_new_json) AS key
      WHERE key NOT IN ('id', 'boucherie_id', 'user_id', 'updated_by', 'created_at', 'updated_at')
    LOOP
      -- Comparer les valeurs pour ce champ
      IF v_old_json->v_key IS DISTINCT FROM v_new_json->v_key THEN
        v_has_changes := TRUE;
        EXIT; -- Sortir dès qu'on trouve une différence
      END IF;
    END LOOP;

    -- Ne créer le log que si au moins un champ a changé
    IF v_has_changes THEN
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
        v_old_json,
        v_new_json
      );
    END IF;

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

-- 2. Message de confirmation
SELECT 'Fonction de traçabilité mise à jour avec succès !' as message,
       'Les UPDATE vides ne seront plus enregistrés.' as details;

-- Fin de la transaction - Commit si tout s'est bien passé
COMMIT;
