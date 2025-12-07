# CLAUDE_REFERENCE.md - Documentation détaillée

> Ce fichier contient les commandes utiles et références techniques pour le projet Boucherie.Compta

---

## 🔑 CREDENTIALS SUPABASE

### 🟢 PRODUCTION (ylhwyotluskuhkjumqpf)
| Info | Valeur |
|------|--------|
| URL | `https://ylhwyotluskuhkjumqpf.supabase.co` |
| Project Ref | `ylhwyotluskuhkjumqpf` |
| DB Host | `db.ylhwyotluskuhkjumqpf.supabase.co` |
| DB Port | `5432` |
| DB Password | `p4zN25F7Gfw9Py` |

### 🔵 DÉVELOPPEMENT (ghqeiknovctwqpucoeuv)
| Info | Valeur |
|------|--------|
| URL | `https://ghqeiknovctwqpucoeuv.supabase.co` |
| Project Ref | `ghqeiknovctwqpucoeuv` |
| DB Host | `db.ghqeiknovctwqpucoeuv.supabase.co` |
| DB Port | `5432` |
| DB Password | `p4zN25F7Gfw9Py` *(même mot de passe que PROD)* |

**⚠️ IMPORTANT** : Par défaut, le fichier `.env` pointe vers l'environnement de **DÉVELOPPEMENT**

---

## 🔧 Commandes PostgreSQL

### 🟢 PRODUCTION - Extraction structure uniquement
```bash
"/c/Program Files/PostgreSQL/17/bin/pg_dump" --schema-only "postgresql://postgres:p4zN25F7Gfw9Py@db.ylhwyotluskuhkjumqpf.supabase.co:5432/postgres" > structure_boucherie.sql
```

### 🟢 PRODUCTION - Dump complet (données + structure)
```bash
"/c/Program Files/PostgreSQL/17/bin/pg_dump" --clean --if-exists --schema=public "postgresql://postgres:p4zN25F7Gfw9Py@db.ylhwyotluskuhkjumqpf.supabase.co:5432/postgres" > dump/dump_boucherie_prod_$(powershell -Command "Get-Date -Format 'dd-MM-yyyy_HH-mm'").sql
```

### 🔵 DEV - Dump complet (données + structure)
```bash
"/c/Program Files/PostgreSQL/17/bin/pg_dump" --clean --if-exists --schema=public "postgresql://postgres:p4zN25F7Gfw9Py@db.ghqeiknovctwqpucoeuv.supabase.co:5432/postgres" > dump/dump_boucherie_dev_$(powershell -Command "Get-Date -Format 'dd-MM-yyyy_HH-mm'").sql
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

**🟢 PRODUCTION - Exécution via psql (RECOMMANDÉ)** :
```bash
"/c/Program Files/PostgreSQL/17/bin/psql" "postgresql://postgres:p4zN25F7Gfw9Py@db.ylhwyotluskuhkjumqpf.supabase.co:5432/postgres" -f sql/clean-production-data.sql
```

**🔵 DEV - Exécution via psql (RECOMMANDÉ)** :
```bash
"/c/Program Files/PostgreSQL/17/bin/psql" "postgresql://postgres:p4zN25F7Gfw9Py@db.ghqeiknovctwqpucoeuv.supabase.co:5432/postgres" -f sql/clean-production-data.sql
```

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

---

## 🔄 WORKFLOW DEV → PROD

### Environnements disponibles
- **🔵 DEV (par défaut)** : Fichier `.env` pointe vers `ghqeiknovctwqpucoeuv`
- **🟢 PROD** : Configuration stockée dans `.env.production`

### Comment basculer d'environnement

**Pour travailler en DEV (par défaut)** :
```bash
# Le fichier .env contient déjà la config DEV
npm run dev
```

**Pour travailler en PROD** :
```bash
# Copier la config PROD dans .env
cp .env.production .env
npm run dev
```

**Pour revenir en DEV** :
```bash
# Copier la config DEV dans .env
cp .env.development .env
npm run dev
```

### Workflow recommandé

1. **Développement** : Travailler sur la branche `dev` avec l'environnement DEV
2. **Tests** : Tester les nouvelles fonctionnalités sur la base DEV
3. **Validation** : Une fois validé, merger `dev` → `master`
4. **Déploiement PROD** : Copier `.env.production` → `.env` et déployer

### Initialisation de la base DEV

Pour initialiser la base DEV avec la structure de PROD :

```bash
# 1. Faire un dump de la structure PROD (sans données)
"/c/Program Files/PostgreSQL/17/bin/pg_dump" --schema-only "postgresql://postgres:p4zN25F7Gfw9Py@db.ylhwyotluskuhkjumqpf.supabase.co:5432/postgres" > dump/structure_prod.sql

# 2. Importer la structure dans DEV
"/c/Program Files/PostgreSQL/17/bin/psql" "postgresql://postgres:p4zN25F7Gfw9Py@db.ghqeiknovctwqpucoeuv.supabase.co:5432/postgres" -f dump/structure_prod.sql

# 3. Optionnel : Importer des données de test
"/c/Program Files/PostgreSQL/17/bin/psql" "postgresql://postgres:p4zN25F7Gfw9Py@db.ghqeiknovctwqpucoeuv.supabase.co:5432/postgres" -f scripts/generate-test-data.sql
```

### ⚠️ RÈGLES DE SÉCURITÉ

- **JAMAIS** exécuter de scripts de nettoyage sur PROD sans backup préalable
- **TOUJOURS** tester les nouveaux scripts SQL sur DEV avant PROD
- **TOUJOURS** vérifier l'environnement actif avant toute modification de base
- Les fichiers `.env*` sont dans `.gitignore` pour éviter de commiter les credentials
