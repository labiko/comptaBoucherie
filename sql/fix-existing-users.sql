-- Script pour corriger les utilisateurs existants après la migration multi-boucherie
-- À exécuter sur Supabase

-- 1. Mettre à jour admin, hany et nacer avec boucherie_id si manquant
DO $$
DECLARE
  wissam_id UUID;
BEGIN
  SELECT id INTO wissam_id FROM boucheries WHERE nom = 'Wissam SARL';

  -- Mettre à jour admin
  UPDATE users
  SET boucherie_id = wissam_id
  WHERE login = 'admin' AND (boucherie_id IS NULL OR boucherie_id != wissam_id);

  -- Mettre à jour ou créer hany
  INSERT INTO users (boucherie_id, login, password_hash, nom, prenom, email, actif)
  VALUES (
    wissam_id,
    'hany',
    hash_password('hany123'),
    'Hany',
    NULL,
    NULL,
    true
  )
  ON CONFLICT (login)
  DO UPDATE SET
    boucherie_id = wissam_id,
    password_hash = hash_password('hany123'),
    nom = 'Hany',
    actif = true,
    updated_at = NOW();

  -- Mettre à jour ou créer nacer
  INSERT INTO users (boucherie_id, login, password_hash, nom, prenom, email, actif)
  VALUES (
    wissam_id,
    'nacer',
    hash_password('nacer123'),
    'Nacer',
    NULL,
    NULL,
    true
  )
  ON CONFLICT (login)
  DO UPDATE SET
    boucherie_id = wissam_id,
    password_hash = hash_password('nacer123'),
    nom = 'Nacer',
    actif = true,
    updated_at = NOW();
END $$;

-- Vérifier que tous les utilisateurs ont un boucherie_id
SELECT
  u.id,
  u.login,
  u.nom,
  b.nom as boucherie,
  u.actif,
  u.created_at
FROM users u
LEFT JOIN boucheries b ON u.boucherie_id = b.id
ORDER BY u.login;

-- Message de confirmation
SELECT 'Utilisateurs corrigés : admin, hany et nacer sont maintenant rattachés à Wissam SARL' as message;
