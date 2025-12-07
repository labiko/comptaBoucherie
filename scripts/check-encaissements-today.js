/**
 * Script pour vérifier les encaissements créés aujourd'hui
 */

import postgres from 'postgres';

const DATABASE_URL = process.env.DATABASE_URL ||
  'postgresql://postgres.ylhwyotluskuhkjumqpf:p4zN25F7Gfw9Py@aws-0-eu-central-1.pooler.supabase.com:6543/postgres';

async function checkEncaissements() {
  console.log('🔍 Vérification des encaissements créés le 07/12/2025...\n');

  const sql = postgres(DATABASE_URL, {
    ssl: 'require',
    max: 1
  });

  try {
    // Chercher tous les encaissements créés le 07/12/2025
    const encaissements = await sql`
      SELECT
        id,
        date,
        espece,
        cb,
        ch_vr,
        tr,
        total,
        boucherie_id,
        created_at,
        updated_at
      FROM encaissements
      WHERE created_at::date = '2025-12-07'
      ORDER BY created_at DESC
    `;

    console.log('═══════════════════════════════════════════════');
    console.log(`📊 Encaissements créés le 07/12/2025 : ${encaissements.length}`);
    console.log('═══════════════════════════════════════════════\n');

    if (encaissements.length === 0) {
      console.log('❌ Aucun encaissement trouvé pour le 07/12/2025\n');
    } else {
      encaissements.forEach((enc, index) => {
        console.log(`\n📄 Encaissement #${index + 1}:`);
        console.log('  ID:', enc.id);
        console.log('  Date:', enc.date);
        console.log('  Espèce:', enc.espece, '€');
        console.log('  CB:', enc.cb, '€');
        console.log('  CH/VR:', enc.ch_vr, '€');
        console.log('  TR:', enc.tr, '€');
        console.log('  Total:', enc.total, '€');
        console.log('  Boucherie ID:', enc.boucherie_id);
        console.log('  Créé le:', new Date(enc.created_at).toLocaleString('fr-FR'));
        console.log('  Mis à jour:', new Date(enc.updated_at).toLocaleString('fr-FR'));
        console.log('  ───────────────────────────────────');
      });

      console.log('\n✅ Derniers encaissements créés à 11H:');
      const at11h = encaissements.filter(e => {
        const hour = new Date(e.created_at).getHours();
        return hour === 11;
      });

      if (at11h.length > 0) {
        console.log(`   Trouvé ${at11h.length} encaissement(s) créé(s) à 11H\n`);
        at11h.forEach(enc => {
          console.log('   -', new Date(enc.created_at).toLocaleString('fr-FR'), '| Date:', enc.date, '| Total:', enc.total, '€');
        });
      } else {
        console.log('   ❌ Aucun encaissement créé à 11H');
      }
    }

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    await sql.end();
    process.exit(1);
  }

  await sql.end();
  console.log('\n✅ Vérification terminée!\n');
}

checkEncaissements().catch(console.error);
