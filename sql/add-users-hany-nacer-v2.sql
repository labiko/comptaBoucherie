-- Script pour ajouter deux nouveaux utilisateurs : hany et nacer
-- Version 2 : avec boucherie_id pour l'architecture multi-boucherie
-- À exécuter dans l'éditeur SQL de Supabase APRÈS migration-multi-boucherie.sql

-- Récupérer l'ID de la boucherie Wissam SARL
DO $$
DECLARE
  wissam_id UUID;
BEGIN
  SELECT id INTO wissam_id FROM boucheries WHERE nom = 'Wissam SARL';

  -- Insérer l'utilisateur Hany
  INSERT INTO users (boucherie_id, login, password_hash, nom, prenom, email, actif)
  VALUES (
    wissam_id,
    'hany',
    hash_password('hany123'),
    'Hany',
    NULL,
    NULL,
    true
  );

  -- Insérer l'utilisateur Nacer
  INSERT INTO users (boucherie_id, login, password_hash, nom, prenom, email, actif)
  VALUES (
    wissam_id,
    'nacer',
    hash_password('nacer123'),
    'Nacer',
    NULL,
    NULL,
    true
  );
END $$;

-- Vérifier que les utilisateurs ont été créés
SELECT
  u.id,
  u.login,
  u.nom,
  u.prenom,
  u.email,
  u.actif,
  b.nom as boucherie,
  u.created_at
FROM users u
JOIN boucheries b ON u.boucherie_id = b.id
WHERE u.login IN ('hany', 'nacer')
ORDER BY u.login;

-- Message de confirmation
SELECT 'Deux nouveaux utilisateurs créés pour Wissam SARL : hany (hany123) et nacer (nacer123)' as message;
