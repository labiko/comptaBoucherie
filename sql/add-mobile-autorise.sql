-- Migration : Ajout de la colonne mobile_autorise pour contrôler l'accès mobile
-- Date : 2025-01-30
-- Description : Ajoute une colonne boolean pour indiquer si la boucherie a payé pour l'accès mobile
-- Par défaut, l'accès mobile est désactivé (false)

-- Ajouter la colonne mobile_autorise à la table boucheries
ALTER TABLE boucheries
ADD COLUMN IF NOT EXISTS mobile_autorise BOOLEAN DEFAULT false NOT NULL;

-- Commentaire de la colonne
COMMENT ON COLUMN boucheries.mobile_autorise IS 'Indique si la boucherie a payé pour utiliser l''application sur mobile (true = autorisé, false = PC uniquement)';

-- Afficher le résultat
SELECT id, nom, mobile_autorise
FROM boucheries
ORDER BY id;
