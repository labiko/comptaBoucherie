/**
 * Script pour supprimer la contrainte d'unicité sur (boucherie_id, date)
 * dans la table encaissements
 */

import postgres from 'postgres';

const DATABASE_URL = process.env.DATABASE_URL ||
  'postgresql://postgres.ylhwyotluskuhkjumqpf:p4zN25F7Gfw9Py@aws-0-eu-central-1.pooler.supabase.com:6543/postgres';

async function removeUniqueConstraint() {
  console.log('🔧 Suppression de la contrainte unique sur encaissements...\n');

  const sql = postgres(DATABASE_URL, {
    ssl: 'require',
    max: 1
  });

  try {
    // Vérifier les contraintes existantes
    console.log('📋 Vérification des contraintes existantes...');
    const existingConstraints = await sql`
      SELECT
        conname AS constraint_name,
        contype AS constraint_type
      FROM pg_constraint
      WHERE conrelid = 'encaissements'::regclass
        AND conname LIKE '%date%'
    `;

    console.log('Contraintes trouvées:', existingConstraints);

    // Supprimer la contrainte unique
    console.log('\n🗑️ Suppression de la contrainte encaissements_boucherie_date_key...');
    await sql`
      ALTER TABLE encaissements
      DROP CONSTRAINT IF EXISTS encaissements_boucherie_date_key
    `;

    console.log('✅ Contrainte supprimée avec succès!\n');

    // Vérifier que la contrainte a bien été supprimée
    console.log('🔍 Vérification après suppression...');
    const remainingConstraints = await sql`
      SELECT
        conname AS constraint_name,
        contype AS constraint_type
      FROM pg_constraint
      WHERE conrelid = 'encaissements'::regclass
    `;

    console.log('Contraintes restantes:', remainingConstraints);

    console.log('\n✅ Opération terminée avec succès!');
    console.log('Les utilisateurs peuvent maintenant créer plusieurs encaissements pour la même date.\n');

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    await sql.end();
    process.exit(1);
  }

  await sql.end();
}

removeUniqueConstraint().catch(console.error);
