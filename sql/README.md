# Scripts SQL - Compta Boucherie

## 📁 Fichiers disponibles

### 1. `supabase-schema.sql`
Script principal de création de la base de données.

**Contient :**
- Extension `pgcrypto` pour le chiffrement
- Table `users` avec authentification
- Table `encaissements`
- Table `factures`
- Vues SQL automatiques (mois courant/archives)
- Fonction `get_mois_archives()`
- Fonction `hash_password()` et `verify_password()`
- Politiques RLS
- Utilisateur par défaut : `admin` / `admin123`

**Exécution :**
1. Allez sur [Supabase Dashboard](https://supabase.com/dashboard)
2. Ouvrez votre projet
3. Allez dans "SQL Editor"
4. Créez une nouvelle requête
5. Copiez-collez le contenu de `supabase-schema.sql`
6. Cliquez sur "Run"

### 2. `insert-test-data.sql`
Script d'insertion de données de test pour novembre 2024.

**Contient :**
- 10 encaissements pour novembre 2024 (du 1er au 12 novembre)
- 5 factures pour novembre 2024
- Données réalistes pour une boucherie

**Exécution :**
1. **IMPORTANT** : Exécutez d'abord `supabase-schema.sql`
2. Allez dans "SQL Editor"
3. Créez une nouvelle requête
4. Copiez-collez le contenu de `insert-test-data.sql`
5. Cliquez sur "Run"

**Résultat attendu :**
- 10 encaissements pour novembre 2024
- 5 factures pour novembre 2024
- Message de confirmation
- Tableau récapitulatif des totaux

## ✅ Ordre d'exécution

```bash
1. supabase-schema.sql    # Créer la structure
2. insert-test-data.sql   # Insérer les données de test (optionnel)
```

## 📊 Données de test insérées

### Encaissements novembre 2024
- 10 jours d'encaissements
- Montants réalistes (entre 1 900€ et 3 250€ par jour)
- Variété de paiements : Espèce, CB, Chèque/Virement, Tickets Restaurant
- Montants plus élevés les weekends

### Factures novembre 2024
- Abattoir Régional : 2 500,00 €
- Volailles du Terroir : 850,00 €
- EDF : 320,50 €
- Emballages Pro : 450,00 €
- Maintenance Frigo : 680,00 €

**Total factures :** 4 800,50 €

## 🔍 Vérification des données

Après l'exécution, vous pouvez vérifier avec ces requêtes :

```sql
-- Voir tous les encaissements de novembre
SELECT * FROM encaissements
WHERE EXTRACT(YEAR FROM date) = 2024
  AND EXTRACT(MONTH FROM date) = 11
ORDER BY date DESC;

-- Voir toutes les factures de novembre
SELECT * FROM factures
WHERE EXTRACT(YEAR FROM date_facture) = 2024
  AND EXTRACT(MONTH FROM date_facture) = 11
ORDER BY date_facture DESC;

-- Voir les totaux
SELECT
  SUM(total) as total_encaissements,
  (SELECT SUM(montant) FROM factures
   WHERE EXTRACT(YEAR FROM date_facture) = 2024
     AND EXTRACT(MONTH FROM date_facture) = 11) as total_factures
FROM encaissements
WHERE EXTRACT(YEAR FROM date) = 2024
  AND EXTRACT(MONTH FROM date) = 11;
```

## 🗑️ Supprimer les données de test

Si vous souhaitez supprimer les données de test :

```sql
-- Supprimer les encaissements de novembre 2024
DELETE FROM encaissements
WHERE EXTRACT(YEAR FROM date) = 2024
  AND EXTRACT(MONTH FROM date) = 11;

-- Supprimer les factures de novembre 2024
DELETE FROM factures
WHERE EXTRACT(YEAR FROM date_facture) = 2024
  AND EXTRACT(MONTH FROM date_facture) = 11;
```
