// Script d'analyse de la traçabilité
// Exécuter avec: node scripts/analyze-tracabilite.js

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ylhwyotluskuhkjumqpf.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlsaHd5b3RsdXNrdWhranVtcXBmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQzNjA3NzUsImV4cCI6MjA3OTkzNjc3NX0.CpY8pyGJcNTczE31PzlIJX1GN3Fi8UC9y6MGyW3zjaU';

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables d\'environnement manquantes');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function analyzeLogs() {
  console.log('\n📊 ANALYSE DE LA TRAÇABILITÉ\n');
  console.log('='.repeat(60));

  // 1. Statistiques globales
  console.log('\n1️⃣ STATISTIQUES GLOBALES');
  console.log('-'.repeat(60));

  const { data: allLogs, error: errorAll } = await supabase
    .from('tracabilite')
    .select('*');

  if (errorAll) {
    console.error('Erreur:', errorAll);
    return;
  }

  console.log(`Total de logs: ${allLogs.length}`);

  const withoutOld = allLogs.filter(l => !l.old_values).length;
  const withoutNew = allLogs.filter(l => !l.new_values).length;
  const updateWithoutChanges = allLogs.filter(l =>
    l.action === 'UPDATE' &&
    l.old_values &&
    l.new_values &&
    JSON.stringify(l.old_values) === JSON.stringify(l.new_values)
  ).length;

  console.log(`Logs avec old_values NULL: ${withoutOld}`);
  console.log(`Logs avec new_values NULL: ${withoutNew}`);
  console.log(`UPDATE sans changement réel: ${updateWithoutChanges}`);

  // 2. Par table et action
  console.log('\n2️⃣ STATISTIQUES PAR TABLE ET ACTION');
  console.log('-'.repeat(60));

  const stats = {};
  allLogs.forEach(log => {
    const key = `${log.table_name} - ${log.action}`;
    if (!stats[key]) {
      stats[key] = { count: 0, oldNull: 0, newNull: 0 };
    }
    stats[key].count++;
    if (!log.old_values) stats[key].oldNull++;
    if (!log.new_values) stats[key].newNull++;
  });

  Object.entries(stats).forEach(([key, value]) => {
    console.log(`${key.padEnd(30)} | Total: ${value.count} | old_null: ${value.oldNull} | new_null: ${value.newNull}`);
  });

  // 3. Triggers actifs - skip (permissions limitées)
  console.log('\n3️⃣ VÉRIFICATION DES TRIGGERS');
  console.log('-'.repeat(60));
  console.log('ℹ️  Vérification des triggers sautée (nécessite permissions admin)');

  // 4. Analyse des 5 derniers UPDATE
  console.log('\n4️⃣ ANALYSE DES 5 DERNIERS UPDATE');
  console.log('-'.repeat(60));

  const updates = allLogs
    .filter(l => l.action === 'UPDATE')
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, 5);

  updates.forEach((log, index) => {
    console.log(`\n[${index + 1}] ${log.table_name} - ${log.timestamp}`);
    console.log(`   User: ${log.user_nom}`);

    if (log.old_values && log.new_values) {
      const changedFields = [];
      const identicalFields = [];

      const allKeys = new Set([
        ...Object.keys(log.old_values),
        ...Object.keys(log.new_values)
      ]);

      allKeys.forEach(key => {
        if (['id', 'boucherie_id', 'user_id', 'updated_by', 'created_at', 'updated_at'].includes(key)) {
          return;
        }

        const oldVal = log.old_values[key];
        const newVal = log.new_values[key];

        if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
          changedFields.push({
            field: key,
            old: oldVal,
            new: newVal
          });
        } else {
          identicalFields.push(key);
        }
      });

      console.log(`   ✅ Champs modifiés (${changedFields.length}):`);
      if (changedFields.length > 0) {
        changedFields.forEach(f => {
          console.log(`      - ${f.field}: "${f.old}" → "${f.new}"`);
        });
      } else {
        console.log('      AUCUN');
      }

      console.log(`   ⚪ Champs identiques (${identicalFields.length}): ${identicalFields.join(', ')}`);
    } else {
      console.log('   ⚠️  old_values ou new_values est NULL');
    }
  });

  // 5. Logs problématiques (ne peuvent pas se déplier)
  console.log('\n5️⃣ LOGS PROBLÉMATIQUES (ne peuvent pas se déplier)');
  console.log('-'.repeat(60));

  const problematic = allLogs.filter(log => {
    if (log.action === 'CREATE') {
      return !log.new_values;
    }
    if (log.action === 'DELETE') {
      return !log.old_values;
    }
    if (log.action === 'UPDATE') {
      if (!log.old_values || !log.new_values) return true;

      // Vérifier si des champs ont changé
      const allKeys = new Set([
        ...Object.keys(log.old_values),
        ...Object.keys(log.new_values)
      ]);

      const changedFields = Array.from(allKeys).filter(key => {
        if (['id', 'boucherie_id', 'user_id', 'updated_by', 'created_at', 'updated_at'].includes(key)) {
          return false;
        }
        return JSON.stringify(log.old_values[key]) !== JSON.stringify(log.new_values[key]);
      });

      return changedFields.length === 0;
    }
    return false;
  });

  console.log(`Nombre de logs problématiques: ${problematic.length}`);

  if (problematic.length > 0) {
    console.log('\nExemples (5 premiers):');
    problematic.slice(0, 5).forEach((log, i) => {
      console.log(`  [${i + 1}] ${log.action} ${log.table_name} - ${log.timestamp}`);
      console.log(`      Raison: ${
        !log.old_values ? 'old_values NULL' :
        !log.new_values ? 'new_values NULL' :
        'Aucun champ modifié'
      }`);
    });
  }

  console.log('\n' + '='.repeat(60));
  console.log('✅ Analyse terminée\n');
}

analyzeLogs().catch(console.error);
