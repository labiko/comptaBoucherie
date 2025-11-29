-- =====================================================
-- Script de diagnostic pour les colonnes piece_jointe
-- =====================================================

-- 1. Vérifier que les colonnes existent
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'factures'
  AND column_name IN ('piece_jointe', 'piece_jointe_updated_at')
ORDER BY column_name;

-- 2. Vérifier les factures avec des pièces jointes
SELECT
  id,
  date_facture,
  fournisseur,
  piece_jointe,
  piece_jointe_updated_at,
  updated_at
FROM factures
WHERE piece_jointe IS NOT NULL
ORDER BY piece_jointe_updated_at DESC NULLS LAST
LIMIT 10;

-- 3. Compter les factures avec/sans pièces jointes
SELECT
  COUNT(*) FILTER (WHERE piece_jointe IS NOT NULL) as avec_piece_jointe,
  COUNT(*) FILTER (WHERE piece_jointe IS NULL) as sans_piece_jointe,
  COUNT(*) as total
FROM factures;

-- 4. Vérifier les politiques RLS sur la table factures
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'factures'
ORDER BY policyname;

-- 5. Vérifier si RLS est activé sur la table
SELECT
  tablename,
  rowsecurity
FROM pg_tables
WHERE tablename = 'factures';
