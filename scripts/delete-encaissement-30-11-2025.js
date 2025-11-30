// Script pour afficher le SQL de suppression des encaissements du 30/11/2025

const sqlDelete = `
-- Suppression des encaissements du 30/11/2025

-- Afficher d'abord ce qui sera supprimé
SELECT
  id,
  boucherie_id,
  date,
  espece,
  cb,
  ch_vr,
  tr,
  total,
  created_at
FROM encaissements
WHERE date = '2025-11-30';

-- Supprimer les encaissements du 30/11/2025
DELETE FROM encaissements
WHERE date = '2025-11-30';

-- Vérifier que la suppression a fonctionné (doit retourner 0)
SELECT COUNT(*) as nombre_restant
FROM encaissements
WHERE date = '2025-11-30';
`;

console.log('📋 Copiez et exécutez ce SQL dans Supabase SQL Editor:\n');
console.log('https://supabase.com/dashboard/project/znipxcuzpwbhddnjclbw/sql\n');
console.log(sqlDelete);
console.log('\n⚠️  ATTENTION: Cette opération est IRRÉVERSIBLE !');
console.log('✅ Vérifiez d\'abord les données avec le premier SELECT avant de lancer le DELETE.');
