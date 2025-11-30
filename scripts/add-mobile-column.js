// Script simple pour ajouter la colonne mobile_autorise
// Exécutez ce SQL manuellement dans Supabase SQL Editor ou utilisez psql

const sqlMigration = `
-- Migration : Ajout de la colonne mobile_autorise
-- Date : 2025-01-30

ALTER TABLE boucheries
ADD COLUMN IF NOT EXISTS mobile_autorise BOOLEAN DEFAULT false NOT NULL;

COMMENT ON COLUMN boucheries.mobile_autorise IS 'Indique si la boucherie a payé pour utiliser l''application sur mobile (true = autorisé, false = PC uniquement)';

-- Vérifier le résultat
SELECT id, nom, mobile_autorise FROM boucheries ORDER BY id;
`;

console.log('📋 Copiez et exécutez ce SQL dans Supabase SQL Editor:\n');
console.log('https://supabase.com/dashboard/project/znipxcuzpwbhddnjclbw/sql\n');
console.log(sqlMigration);
console.log('\n✅ Une fois exécuté, relancez le serveur de développement.');
