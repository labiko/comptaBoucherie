# CLAUDE_REFERENCE.md - Documentation détaillée

> Ce fichier contient les commandes utiles et références techniques pour le projet Boucherie.Compta

---

## 🔑 CREDENTIALS SUPABASE

| Info | Valeur |
|------|--------|
| URL | `https://ylhwyotluskuhkjumqpf.supabase.co` |
| Project Ref | `ylhwyotluskuhkjumqpf` |
| DB Host | `db.ylhwyotluskuhkjumqpf.supabase.co` |

**Note** : Le mot de passe est disponible dans le dashboard Supabase

---

## 🔧 Commandes PostgreSQL

### Extraction structure uniquement
```bash
"/c/Program Files/PostgreSQL/17/bin/pg_dump" --schema-only "postgresql://postgres:p4zN25F7Gfw9Py@db.ylhwyotluskuhkjumqpf.supabase.co:5432/postgres" > structure_boucherie.sql
```

### Dump complet (données + structure)
```bash
"/c/Program Files/PostgreSQL/17/bin/pg_dump" --clean --if-exists --schema=public "postgresql://postgres:p4zN25F7Gfw9Py@db.ylhwyotluskuhkjumqpf.supabase.co:5432/postgres" > dump/dump_boucherie_$(powershell -Command "Get-Date -Format 'dd-MM-yyyy_HH-mm'").sql
```

**Note** : Les dumps sont sauvegardés dans le dossier `dump/` avec horodatage au format français (dd-MM-yyyy_HH-mm)

**Paramètres expliqués :**
- `--clean` : Ajoute les commandes DROP avant CREATE
- `--if-exists` : Utilise DROP ... IF EXISTS pour éviter les erreurs
- `--schema=public` : Exporte uniquement le schéma public
- ⚠️ Les permissions (GRANT/REVOKE) sont **incluses** dans le dump pour éviter les problèmes d'accès après import

---

## 🗑️ Nettoyage de la base de données

### Script de nettoyage complet
**Fichier** : `sql/clean-production-data.sql`

Ce script supprime toutes les données de test/production tout en préservant :
- ✅ Les utilisateurs (table users)
- ✅ Les boucheries (table boucheries)
- ✅ Les configurations SMTP
- ✅ Toutes les autres données système

Il supprime :
- ❌ Tous les encaissements
- ❌ Toutes les factures
- ❌ Tous les fournisseurs
- ❌ Toute la traçabilité associée
- ❌ Tout l'historique des envois comptables

**Exécution directe via psql (RECOMMANDÉ)** :
```bash
"/c/Program Files/PostgreSQL/17/bin/psql" "postgresql://postgres:p4zN25F7Gfw9Py@db.ylhwyotluskuhkjumqpf.supabase.co:5432/postgres" -f sql/clean-production-data.sql
```

**Exécution alternative via Node.js** :
```bash
node scripts/exec-sql.js sql/clean-production-data.sql
```
(Note: Le script Node.js a des problèmes avec les transactions BEGIN/COMMIT, utiliser psql de préférence)

⚠️ **ATTENTION** : Opération IRRÉVERSIBLE ! Toujours faire un dump avant.

---

## 📁 Structure des scripts SQL

```
sql/
├── create-dashboard-views.sql    # Vues pour le Dashboard
├── create-tables.sql             # Structure des tables
└── migrations/                   # Migrations futures
```

---

## 🔄 RÈGLES SQL

- **SELECT** : Exécution directe OK
- **INSERT/UPDATE/DELETE** : Toujours donner le script à l'utilisateur pour exécution manuelle
- **Transactions** : Toujours encapsuler dans `BEGIN;` ... `COMMIT;`
- **Scripts de modification** : Toujours tester sur données de test avant production

---

## 📊 Tables principales

- `boucheries` : Informations des boucheries
- `users` : Utilisateurs de l'application
- `encaissements` : Encaissements quotidiens (espèce, CB, chèque/virement, TR)
- `factures` : Factures fournisseurs

---

## 🎯 Vues Dashboard

- `v_dashboard_stats` : Statistiques globales (recettes, totaux, alertes)
- `v_dashboard_week` : Encaissements de la semaine actuelle (lundi à dimanche)
- `v_dashboard_factures_retard` : Factures impayées avec plus de 30 jours de retard
- `v_dashboard_top_fournisseurs_impayes` : Top 3 des fournisseurs avec impayés

---

## 💡 RAPPELS

- La semaine commence le lundi et se termine le dimanche
- Gestion spéciale du dimanche (DOW = 0) dans les calculs de semaine
- Les encaissements peuvent avoir plusieurs lignes par jour (agrégation par SUM)
- Le mois est toujours automatique basé sur la date courante
