-- Script pour ajouter deux nouveaux utilisateurs : hany et nacer
-- À exécuter dans l'éditeur SQL de Supabase

-- Insérer l'utilisateur Hany
INSERT INTO users (login, password_hash, nom, prenom, email, actif)
VALUES (
  'hany',
  hash_password('hany123'),
  'Hany',
  NULL,
  NULL,
  true
);

-- Insérer l'utilisateur Nacer
INSERT INTO users (login, password_hash, nom, prenom, email, actif)
VALUES (
  'nacer',
  hash_password('nacer123'),
  'Nacer',
  NULL,
  NULL,
  true
);

-- Vérifier que les utilisateurs ont été créés
SELECT
  id,
  login,
  nom,
  prenom,
  email,
  actif,
  created_at
FROM users
WHERE login IN ('hany', 'nacer')
ORDER BY login;

-- Message de confirmation
SELECT 'Deux nouveaux utilisateurs créés : hany (hany123) et nacer (nacer123)' as message;
