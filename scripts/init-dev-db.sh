#!/bin/bash

# Script d'initialisation de la base de données DEV
# Date : 2025-12-07
# Objectif : Initialiser la base DEV avec la structure de PROD

echo "=========================================="
echo "Initialisation de la base de données DEV"
echo "=========================================="
echo ""

# Configuration
PROD_CONNECTION="postgresql://postgres:p4zN25F7Gfw9Py@db.ylhwyotluskuhkjumqpf.supabase.co:5432/postgres"
DEV_CONNECTION="postgresql://postgres:p4zN25F7Gfw9Py@db.ghqeiknovctwqpucoeuv.supabase.co:5432/postgres"
PG_DUMP="/c/Program Files/PostgreSQL/17/bin/pg_dump"
PSQL="/c/Program Files/PostgreSQL/17/bin/psql"
DUMP_FILE="dump/structure_prod_$(powershell -Command "Get-Date -Format 'dd-MM-yyyy_HH-mm'").sql"

echo "📊 Étape 1/3 : Extraction de la structure PROD..."
"$PG_DUMP" --schema-only --clean --if-exists "$PROD_CONNECTION" > "$DUMP_FILE"

if [ $? -eq 0 ]; then
  echo "✅ Structure PROD extraite dans : $DUMP_FILE"
else
  echo "❌ Erreur lors de l'extraction de la structure PROD"
  exit 1
fi

echo ""
echo "📥 Étape 2/3 : Import de la structure dans DEV..."
"$PSQL" "$DEV_CONNECTION" -f "$DUMP_FILE"

if [ $? -eq 0 ]; then
  echo "✅ Structure importée avec succès dans DEV"
else
  echo "❌ Erreur lors de l'import dans DEV"
  exit 1
fi

echo ""
echo "👥 Étape 3/3 : Création des utilisateurs de test..."

# Script SQL pour créer des utilisateurs de test
cat > /tmp/create-test-users.sql <<'EOF'
-- Création des utilisateurs de test pour l'environnement DEV
BEGIN;

-- Créer une boucherie de test si elle n'existe pas
INSERT INTO boucheries (id, nom, adresse, ville, code_postal, telephone, email)
VALUES (
  1,
  'Boucherie Test DEV',
  '123 Rue de Test',
  'Paris',
  '75001',
  '0123456789',
  'test@boucherie-dev.fr'
)
ON CONFLICT (id) DO NOTHING;

-- Créer un utilisateur admin de test
INSERT INTO users (login, password_hash, nom, prenom, email, role, actif, boucherie_id, is_super_admin)
VALUES (
  'admin',
  extensions.crypt('admin', extensions.gen_salt('bf')),
  'Admin',
  'Test',
  'admin@test.fr',
  'admin',
  true,
  1,
  true
)
ON CONFLICT (login) DO UPDATE SET
  password_hash = extensions.crypt('admin', extensions.gen_salt('bf')),
  actif = true;

-- Créer un utilisateur standard de test
INSERT INTO users (login, password_hash, nom, prenom, email, role, actif, boucherie_id, is_super_admin)
VALUES (
  'user',
  extensions.crypt('user', extensions.gen_salt('bf')),
  'User',
  'Test',
  'user@test.fr',
  'user',
  true,
  1,
  false
)
ON CONFLICT (login) DO UPDATE SET
  password_hash = extensions.crypt('user', extensions.gen_salt('bf')),
  actif = true;

-- Afficher les utilisateurs créés
SELECT
  '✅ Utilisateurs de test créés' as message;

SELECT
  login,
  nom,
  prenom,
  role,
  actif,
  is_super_admin
FROM users
WHERE login IN ('admin', 'user');

COMMIT;
EOF

"$PSQL" "$DEV_CONNECTION" -f /tmp/create-test-users.sql

if [ $? -eq 0 ]; then
  echo "✅ Utilisateurs de test créés avec succès"
  echo ""
  echo "📝 Credentials de test :"
  echo "   - Admin : login = admin, password = admin"
  echo "   - User  : login = user, password = user"
else
  echo "❌ Erreur lors de la création des utilisateurs de test"
  exit 1
fi

echo ""
echo "=========================================="
echo "✅ Initialisation terminée avec succès !"
echo "=========================================="
echo ""
echo "🔵 Votre environnement DEV est prêt à l'emploi"
echo ""
echo "Pour commencer à travailler :"
echo "  1. Vérifiez que .env pointe vers DEV (ghqeiknovctwqpucoeuv)"
echo "  2. Lancez : npm run dev"
echo "  3. Connectez-vous avec : admin / admin"
echo ""
