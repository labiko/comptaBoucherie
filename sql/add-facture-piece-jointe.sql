-- =====================================================
-- Ajout des colonnes pour les pièces jointes de factures
-- piece_jointe : URL de l'image stockée dans Supabase Storage
-- piece_jointe_updated_at : Date de dernière modification de la pièce jointe
-- =====================================================

-- Début de la transaction
BEGIN;

-- 1. Ajouter la colonne piece_jointe (nullable)
ALTER TABLE factures
  ADD COLUMN IF NOT EXISTS piece_jointe TEXT;

-- 2. Ajouter la colonne piece_jointe_updated_at (nullable)
ALTER TABLE factures
  ADD COLUMN IF NOT EXISTS piece_jointe_updated_at TIMESTAMP WITH TIME ZONE;

-- 3. Créer un index pour optimiser les requêtes sur les factures avec pièces jointes
CREATE INDEX IF NOT EXISTS idx_factures_piece_jointe ON factures(piece_jointe) WHERE piece_jointe IS NOT NULL;

-- 4. Commentaires pour documentation
COMMENT ON COLUMN factures.piece_jointe IS 'URL de la pièce jointe (image) stockée dans Supabase Storage';
COMMENT ON COLUMN factures.piece_jointe_updated_at IS 'Date de dernière modification de la pièce jointe';

-- 5. Message de confirmation
SELECT
  '✅ Colonnes piece_jointe ajoutées avec succès !' as message,
  (SELECT COUNT(*) FROM factures) as total_factures,
  (SELECT COUNT(*) FROM factures WHERE piece_jointe IS NOT NULL) as factures_avec_piece_jointe;

-- Fin de la transaction - Commit si tout s'est bien passé
COMMIT;

-- =====================================================
-- INSTRUCTIONS POUR SUPABASE STORAGE
-- =====================================================
--
-- 1. Créer un bucket nommé 'factures-images' dans Supabase Storage
-- 2. Configuration du bucket :
--    - Type : Private (accès contrôlé)
--    - File size limit : 5 MB
--    - Allowed MIME types : image/jpeg, image/png, image/webp
--
-- 3. Configuration RLS (Row Level Security) :
--    - Policy INSERT : Autoriser les utilisateurs authentifiés de leur propre boucherie
--    - Policy SELECT : Autoriser les utilisateurs authentifiés de leur propre boucherie
--    - Policy DELETE : Autoriser les utilisateurs authentifiés de leur propre boucherie
--
-- 4. Organisation des fichiers dans le bucket :
--    Structure : {boucherie_id}/{facture_id}.{extension}
--    Exemple : a1b2c3d4-e5f6-7890-abcd-ef1234567890/f9e8d7c6-b5a4-3210-fedc-ba0987654321.jpg
--
-- =====================================================
