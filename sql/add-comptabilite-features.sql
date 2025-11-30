-- Migration pour ajouter les fonctionnalités d'envoi comptabilité
-- Date : 2025-01-30

-- 1. Créer la table de traçabilité des envois
CREATE TABLE IF NOT EXISTS envois_comptabilite (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  boucherie_id UUID REFERENCES boucheries(id) ON DELETE CASCADE NOT NULL,
  type_export TEXT NOT NULL CHECK (type_export IN ('factures', 'encaissements')),
  mois INTEGER NOT NULL CHECK (mois >= 1 AND mois <= 12),
  annee INTEGER NOT NULL CHECK (annee >= 2020),
  date_envoi TIMESTAMP DEFAULT NOW() NOT NULL,
  email_destinataire TEXT NOT NULL,
  nombre_lignes INTEGER DEFAULT 0,
  statut TEXT DEFAULT 'envoye' CHECK (statut IN ('envoye', 'erreur')),
  erreur_message TEXT,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Index pour améliorer les performances de recherche
CREATE INDEX IF NOT EXISTS idx_envois_boucherie ON envois_comptabilite(boucherie_id);
CREATE INDEX IF NOT EXISTS idx_envois_date ON envois_comptabilite(date_envoi DESC);
CREATE INDEX IF NOT EXISTS idx_envois_periode ON envois_comptabilite(annee, mois);

-- Commentaires
COMMENT ON TABLE envois_comptabilite IS 'Historique des envois de données comptables (factures et encaissements)';
COMMENT ON COLUMN envois_comptabilite.type_export IS 'Type de données exportées: factures ou encaissements';
COMMENT ON COLUMN envois_comptabilite.mois IS 'Mois concerné par l''export (1-12)';
COMMENT ON COLUMN envois_comptabilite.annee IS 'Année concernée par l''export';
COMMENT ON COLUMN envois_comptabilite.email_destinataire IS 'Email du comptable destinataire';
COMMENT ON COLUMN envois_comptabilite.nombre_lignes IS 'Nombre de lignes dans le fichier CSV exporté';
COMMENT ON COLUMN envois_comptabilite.statut IS 'Statut de l''envoi: envoye ou erreur';

-- 2. Ajouter les colonnes à la table boucheries
ALTER TABLE boucheries
ADD COLUMN IF NOT EXISTS email_comptable TEXT;

ALTER TABLE boucheries
ADD COLUMN IF NOT EXISTS envoi_auto_factures BOOLEAN DEFAULT false NOT NULL;

-- Commentaires pour les nouvelles colonnes
COMMENT ON COLUMN boucheries.email_comptable IS 'Email du comptable pour l''envoi mensuel automatique des factures';
COMMENT ON COLUMN boucheries.envoi_auto_factures IS 'Active l''envoi automatique mensuel (true = activé, false = désactivé)';

-- 3. Vérification
SELECT
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name IN ('envois_comptabilite', 'boucheries')
  AND column_name IN ('email_comptable', 'envoi_auto_factures', 'type_export', 'statut')
ORDER BY table_name, ordinal_position;
